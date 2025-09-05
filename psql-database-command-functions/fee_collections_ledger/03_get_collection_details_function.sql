
-- Gemini CLI Generated SQL File (Corrected)
-- Date: 2025-08-21
-- Task: Create a function to get all details for a single collection.

-- =============================================================================
-- STEP 1: CREATE THE DETAILED FETCH FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_collection_details(p_collection_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_collection_type collection_type;
    v_details JSONB;
BEGIN
    -- Determine the collection type
    SELECT collection_type INTO v_collection_type FROM public.collections WHERE id = p_collection_id;

    -- Base details with payments
    SELECT jsonb_build_object(
        'collection', to_jsonb(c.*),
        'exam', to_jsonb(e.*),
        'madrasa', to_jsonb(m.*),
        'payments', (
            SELECT jsonb_agg(to_jsonb(p.*))
            FROM fee_collection_payments p
            WHERE p.collection_id = c.id
        )
    ) INTO v_details
    FROM public.collections c
    JOIN public.exams e ON c.exam_id = e.id
    JOIN public.madrasas m ON c.madrasa_id = m.id
    WHERE c.id = p_collection_id;

    -- Add specific details based on type
    IF v_collection_type = 'registration_fee' THEN
        v_details := v_details || jsonb_build_object('registration_details', (
            SELECT jsonb_agg(jsonb_build_object(
                'marhalaNameBn', mar.name_bn,
                'regularStudents', rd.regular_students,
                'irregularStudents', rd.irregular_students,
                'calculatedFee', rd.calculated_fee_for_marhala
            ))
            FROM public.registration_fee_details rd
            JOIN public.marhalas mar ON rd.marhala_id = mar.id
            WHERE rd.collection_id = p_collection_id
        ));
    ELSIF v_collection_type = 'exam_fee' THEN
        v_details := v_details || jsonb_build_object('exam_details', (
            SELECT jsonb_agg(jsonb_build_object(
                'examineeNameBn', ex.name_bn,
                'registrationNumber', ex.registration_number,
                'rollNumber', ex.roll_number,
                'paidFee', ed.paid_fee
            ))
            FROM public.exam_fee_details ed
            JOIN public.examinees ex ON ed.examinee_id = ex.id
            WHERE ed.collection_id = p_collection_id
        ));
    END IF;

    RETURN v_details;
END;
$$;
