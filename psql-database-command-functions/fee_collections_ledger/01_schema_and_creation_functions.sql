
-- Gemini CLI Generated SQL File (Corrected)
-- Date: 2025-08-21
-- Task: Implement a Centralized Transaction Ledger (Safe Version)
-- Note: This version avoids conflicts with existing tables.

-- =============================================================================
-- STEP 1: DEFINE NEW TABLE STRUCTURES
-- =============================================================================

-- Drop only the objects this script creates, if they exist from a previous attempt.
DROP FUNCTION IF EXISTS create_registration_fee_collection_v2;
DROP FUNCTION IF EXISTS create_exam_fee_collection_v2;
DROP FUNCTION IF EXISTS get_collections_list;
DROP TABLE IF EXISTS fee_collection_payments;
DROP TABLE IF EXISTS registration_fee_details;
DROP TABLE IF EXISTS exam_fee_details;
DROP TABLE IF EXISTS collections;
DROP TYPE IF EXISTS collection_type;


-- A type to distinguish between different kinds of collections
CREATE TYPE collection_type AS ENUM ('registration_fee', 'exam_fee');

-- The master `collections` table. Holds data common to all collection types.
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_type collection_type NOT NULL,
    exam_id UUID NOT NULL REFERENCES exams(id),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id),
    apply_late_fee BOOLEAN NOT NULL DEFAULT false,
    total_calculated_fee NUMERIC(10, 2) NOT NULL,
    collection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_collections_exam_id ON collections(exam_id);
CREATE INDEX idx_collections_madrasa_id ON collections(madrasa_id);


-- The new, central ledger for FEE PAYMENTS.
-- The `receipt_no` is a serial primary key, which starts at 1 and increments automatically.
CREATE TABLE fee_collection_payments (
    receipt_no SERIAL PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL,
    payment_date DATE NOT NULL,
    transaction_id TEXT,
    bank_name TEXT,
    branch_name TEXT,
    check_number TEXT,
    mobile_banking_provider TEXT,
    sender_number TEXT,
    receiver_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_fee_collection_payments_collection_id ON fee_collection_payments(collection_id);


-- Table to store the specific details for registration fee collections.
CREATE TABLE registration_fee_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    marhala_id UUID NOT NULL REFERENCES marhalas(id),
    regular_students INT NOT NULL,
    irregular_students INT NOT NULL,
    calculated_fee_for_marhala NUMERIC(10, 2) NOT NULL,
    registration_number_range_start INT,
    registration_number_range_end INT
);
CREATE INDEX idx_registration_fee_details_collection_id ON registration_fee_details(collection_id);


-- Table to store the specific details for exam fee collections.
CREATE TABLE exam_fee_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    examinee_id UUID NOT NULL REFERENCES examinees(id),
    paid_fee NUMERIC(10, 2) NOT NULL,
    student_type TEXT NOT NULL,
    marhala_id UUID NOT NULL REFERENCES marhalas(id)
);
CREATE INDEX idx_exam_fee_details_collection_id ON exam_fee_details(collection_id);


-- =============================================================================
-- STEP 2: CREATE NEW DATABASE FUNCTIONS
-- =============================================================================

-- New function for creating a REGISTRATION fee collection
CREATE OR REPLACE FUNCTION create_registration_fee_collection_v2(
    p_exam_id UUID,
    p_madrasa_id UUID,
    p_apply_late_fee BOOLEAN,
    p_collection_date TIMESTAMPTZ,
    p_marhala_counts JSONB,
    p_payments JSONB,
    p_total_calculated_fee NUMERIC
)
RETURNS TABLE ( new_collection_id UUID )
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_collection_id UUID;
    marhala_detail RECORD;
    payment_detail RECORD;
BEGIN
    INSERT INTO public.collections (collection_type, exam_id, madrasa_id, apply_late_fee, total_calculated_fee, collection_date, created_by)
    VALUES ('registration_fee', p_exam_id, p_madrasa_id, p_apply_late_fee, p_total_calculated_fee, p_collection_date, auth.uid())
    RETURNING id INTO v_collection_id;

    FOR marhala_detail IN SELECT * FROM jsonb_to_recordset(p_marhala_counts) AS x(
        "marhalaId" UUID, "regularStudents" INT, "irregularStudents" INT, "calculatedFee" NUMERIC, "displayedRegNoStart" INT, "displayedRegNoEnd" INT
    )
    LOOP
        INSERT INTO public.registration_fee_details (collection_id, marhala_id, regular_students, irregular_students, calculated_fee_for_marhala, registration_number_range_start, registration_number_range_end)
        VALUES (v_collection_id, marhala_detail."marhalaId", marhala_detail."regularStudents", marhala_detail."irregularStudents", marhala_detail."calculatedFee", marhala_detail."displayedRegNoStart", marhala_detail."displayedRegNoEnd");
    END LOOP;

    FOR payment_detail IN SELECT * FROM jsonb_to_recordset(p_payments) AS x(
        method TEXT, amount NUMERIC, "paymentDate" DATE, "transactionId" TEXT, "bankName" TEXT, "branchName" TEXT, "checkNumber" TEXT, "mobileBankingProvider" TEXT, "senderNumber" TEXT, "receiverNumber" TEXT, notes TEXT
    )
    LOOP
        INSERT INTO public.fee_collection_payments (collection_id, method, amount, payment_date, transaction_id, bank_name, branch_name, check_number, mobile_banking_provider, sender_number, receiver_number, notes, created_by)
        VALUES (v_collection_id, payment_detail.method, payment_detail.amount, payment_detail."paymentDate", payment_detail."transactionId", payment_detail."bankName", payment_detail."branchName", payment_detail."checkNumber", payment_detail."mobileBankingProvider", payment_detail."senderNumber", payment_detail."receiverNumber", payment_detail.notes, auth.uid());
    END LOOP;
    
    UPDATE exams SET last_used_registration_number = (SELECT GREATEST(COALESCE(last_used_registration_number, 0), (SELECT MAX(rfd.registration_number_range_end) FROM public.registration_fee_details rfd WHERE rfd.collection_id = v_collection_id))) WHERE id = p_exam_id;

    RETURN QUERY SELECT v_collection_id;
END;
$$;


-- New function for creating an EXAM fee collection
CREATE OR REPLACE FUNCTION create_exam_fee_collection_v2(
    p_exam_id UUID,
    p_madrasa_id UUID,
    p_apply_late_fee BOOLEAN,
    p_collection_date TIMESTAMPTZ,
    p_examinee_fee_details_json JSONB,
    p_payments_json JSONB,
    p_total_calculated_fee NUMERIC
)
RETURNS TABLE ( new_collection_id UUID )
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_collection_id UUID;
    examinee_detail RECORD;
    payment_detail RECORD;
BEGIN
    INSERT INTO public.collections (collection_type, exam_id, madrasa_id, apply_late_fee, total_calculated_fee, collection_date, created_by)
    VALUES ('exam_fee', p_exam_id, p_madrasa_id, p_apply_late_fee, p_total_calculated_fee, p_collection_date, auth.uid())
    RETURNING id INTO v_collection_id;

    FOR examinee_detail IN SELECT * FROM jsonb_to_recordset(p_examinee_fee_details_json) AS x(
        "examineeId" UUID, "paidFee" NUMERIC, "studentType" TEXT, "marhalaId" UUID
    )
    LOOP
        INSERT INTO public.exam_fee_details (collection_id, examinee_id, paid_fee, student_type, marhala_id)
        VALUES (v_collection_id, examinee_detail."examineeId", examinee_detail."paidFee", examinee_detail."studentType", examinee_detail."marhalaId");
        
        UPDATE public.examinees SET status = 'fee_paid' WHERE id = examinee_detail."examineeId";
    END LOOP;

    FOR payment_detail IN SELECT * FROM jsonb_to_recordset(p_payments_json) AS x(
        method TEXT, amount NUMERIC, "paymentDate" DATE, "transactionId" TEXT, "bankName" TEXT, "branchName" TEXT, "checkNumber" TEXT, "mobileBankingProvider" TEXT, "senderNumber" TEXT, "receiverNumber" TEXT, notes TEXT
    )
    LOOP
        INSERT INTO public.fee_collection_payments (collection_id, method, amount, payment_date, transaction_id, bank_name, branch_name, check_number, mobile_banking_provider, sender_number, receiver_number, notes, created_by)
        VALUES (v_collection_id, payment_detail.method, payment_detail.amount, payment_detail."paymentDate", payment_detail."transactionId", payment_detail."bankName", payment_detail."branchName", payment_detail."checkNumber", payment_detail."mobileBankingProvider", payment_detail."senderNumber", payment_detail."receiverNumber", payment_detail.notes, auth.uid());
    END LOOP;

    RETURN QUERY SELECT v_collection_id;
END;
$$;


-- =============================================================================
-- STEP 3: CREATE NEW FUNCTION FOR FETCHING COLLECTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_collections_list(
    p_page INT,
    p_limit INT,
    p_search_term TEXT
)
RETURNS TABLE (
    "id" UUID,
    "collectionType" collection_type,
    "examName" TEXT,
    "madrasaNameBn" TEXT,
    "madrasaCode" INT,
    "totalCalculatedFee" NUMERIC,
    "totalPaidAmount" NUMERIC,
    "balanceAmount" NUMERIC,
    "collectionDate" TIMESTAMPTZ,
    "receipts" JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH collection_payments AS (
        SELECT
            t.collection_id,
            COALESCE(SUM(t.amount), 0) as paid_amount,
            jsonb_agg(jsonb_build_object('receiptNo', t.receipt_no, 'amount', t.amount) ORDER BY t.receipt_no) as receipts_json
        FROM fee_collection_payments t
        GROUP BY t.collection_id
    )
    SELECT
        c.id,
        c.collection_type,
        e.name as "examName",
        m.name_bn as "madrasaNameBn",
        m.madrasa_code as "madrasaCode",
        c.total_calculated_fee,
        cp.paid_amount as "totalPaidAmount",
        (c.total_calculated_fee - cp.paid_amount) as "balanceAmount",
        c.collection_date,
        cp.receipts_json as receipts
    FROM collections c
    JOIN exams e ON c.exam_id = e.id
    JOIN madrasas m ON c.madrasa_id = m.id
    LEFT JOIN collection_payments cp ON c.id = cp.collection_id
    WHERE p_search_term IS NULL OR
          e.name ILIKE '%' || p_search_term || '%' OR
          m.name_bn ILIKE '%' || p_search_term || '%' OR
          m.madrasa_code::TEXT ILIKE '%' || p_search_term || '%'
    ORDER BY c.collection_date DESC
    LIMIT p_limit
    OFFSET (p_page - 1) * p_limit;
END;
$$;
