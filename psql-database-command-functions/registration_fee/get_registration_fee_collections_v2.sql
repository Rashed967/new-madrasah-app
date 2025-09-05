-- This function replaces the old get_registration_fee_collections
-- It reads from the new table structure: collections, registration_fee_details, and fee_collection_payments
-- Version 2: Uses subqueries to avoid potential syntax errors with WITH clauses.
CREATE OR REPLACE FUNCTION public.get_registration_fee_collections(
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10,
    p_search_term TEXT DEFAULT NULL,
    p_exam_id_filter UUID DEFAULT NULL,
    p_madrasa_id_filter UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _offset INTEGER;
    _items_jsonb JSONB;
    _total_items INTEGER;
    _base_query TEXT;
    _data_query TEXT;
    _count_query TEXT;
    _search_condition TEXT := '';
    _filter_condition TEXT := '';
BEGIN
    _offset := (p_page - 1) * p_limit;

    IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
        _search_condition := format(' AND (c.id::text ILIKE %1$L OR e.name ILIKE %1$L OR m.name_bn ILIKE %1$L OR m.madrasa_code::text ILIKE %1$L)', '%' || p_search_term || '%');
    END IF;

    IF p_exam_id_filter IS NOT NULL THEN
        _filter_condition := _filter_condition || format(' AND c.exam_id = %L', p_exam_id_filter);
    END IF;
    IF p_madrasa_id_filter IS NOT NULL THEN
        _filter_condition := _filter_condition || format(' AND c.madrasa_id = %L', p_madrasa_id_filter);
    END IF;

    _base_query := '
        FROM public.collections c
        JOIN public.exams e ON c.exam_id = e.id
        JOIN public.madrasas m ON c.madrasa_id = m.id
        WHERE c.collection_type = ''registration_fee''' || _search_condition || _filter_condition;

    _count_query := 'SELECT COUNT(c.id)' || _base_query;
    EXECUTE _count_query INTO _total_items;

    _data_query := '
        SELECT
            c.id,
            NULL AS receipt_no,
            c.exam_id,
            e.name AS exam_name,
            c.madrasa_id,
            m.name_bn AS madrasa_name_bn,
            m.madrasa_code AS madrasa_code,
            c.apply_late_fee,
            c.collection_date,
            c.total_calculated_fee,
            (SELECT COALESCE(SUM(p.amount), 0) FROM public.fee_collection_payments p WHERE p.collection_id = c.id) AS total_paid_amount,
            (c.total_calculated_fee - (SELECT COALESCE(SUM(p.amount), 0) FROM public.fee_collection_payments p WHERE p.collection_id = c.id)) AS balance_amount,
            c.created_at,
            (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    ''marhala_id'', rfd.marhala_id,
                    ''marhalaNameBn'', mar.name_bn,
                    ''regular_students'', rfd.regular_students,
                    ''irregular_students'', rfd.irregular_students,
                    ''calculated_fee_for_marhala'', rfd.calculated_fee_for_marhala,
                    ''registration_number_range_start'', rfd.registration_number_range_start,
                    ''registration_number_range_end'', rfd.registration_number_range_end
                ) ORDER BY mar.marhala_order), ''[]''::jsonb)
                FROM public.registration_fee_details rfd
                JOIN public.marhalas mar ON rfd.marhala_id = mar.id
                WHERE rfd.collection_id = c.id
            ) AS marhala_student_counts,
            (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    ''id'', p.receipt_no,
                    ''method'', p.method,
                    ''amount'', p.amount,
                    ''paymentDate'', p.payment_date,
                    ''transactionId'', p.transaction_id,
                    ''bankName'', p.bank_name,
                    ''branchName'', p.branch_name,
                    ''accountNumber'', NULL,
                    ''checkNumber'', p.check_number,
                    ''mobileBankingProvider'', p.mobile_banking_provider,
                    ''senderNumber'', p.sender_number,
                    ''receiverNumber'', p.receiver_number,
                    ''notes'', p.notes
                ) ORDER BY p.created_at), ''[]''::jsonb)
                FROM public.fee_collection_payments p
                WHERE p.collection_id = c.id
            ) AS payments
        ' || _base_query || '
        ORDER BY c.collection_date DESC, c.created_at DESC
        LIMIT ' || p_limit || ' OFFSET ' || _offset;

    EXECUTE 'SELECT COALESCE(jsonb_agg(q), ''[]''::jsonb) FROM (' || _data_query || ') q' INTO _items_jsonb;

    RETURN jsonb_build_object('items', _items_jsonb, 'totalItems', _total_items);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registration_fee_collections(INTEGER, INTEGER, TEXT, UUID, UUID) TO authenticated;
