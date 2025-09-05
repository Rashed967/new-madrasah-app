
-- Gemini CLI Generated SQL File (Corrected)
-- Date: 2025-08-21
-- Task: Update list function to allow filtering by collection type and include total count.

-- =============================================================================
-- STEP 1: UPDATE THE FUNCTION FOR FETCHING COLLECTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_collections_list(
    p_page INT,
    p_limit INT,
    p_search_term TEXT,
    p_collection_type collection_type -- New parameter for filtering
)
RETURNS JSON
LANGUAGE plpgsql
AS $
DECLARE
    result JSON;
BEGIN
    WITH filtered_collections AS (
        SELECT
            c.id,
            c.collection_type,
            e.name as "examName",
            m.name_bn as "madrasaNameBn",
            m.madrasa_code as "madrasaCode",
            c.total_calculated_fee,
            (SELECT COALESCE(SUM(amount), 0) FROM fee_collection_payments WHERE collection_id = c.id) as "totalPaidAmount",
            (c.total_calculated_fee - (SELECT COALESCE(SUM(amount), 0) FROM fee_collection_payments WHERE collection_id = c.id)) as "balanceAmount",
            c.collection_date,
            (SELECT jsonb_agg(jsonb_build_object('receiptNo', receipt_no, 'amount', amount) ORDER BY receipt_no) FROM fee_collection_payments WHERE collection_id = c.id) as receipts
        FROM collections c
        JOIN exams e ON c.exam_id = e.id
        JOIN madrasas m ON c.madrasa_id = m.id
        WHERE
            (p_collection_type IS NULL OR c.collection_type = p_collection_type)
            AND
            (p_search_term IS NULL OR
              e.name ILIKE '%' || p_search_term || '%' OR
              m.name_bn ILIKE '%' || p_search_term || '%' OR
              m.madrasa_code::TEXT ILIKE '%' || p_search_term || '%')
    )
    SELECT json_build_object(
        'items', COALESCE(json_agg(t), '[]'::json),
        'totalItems', (SELECT COUNT(*) FROM filtered_collections)
    )
    INTO result
    FROM (
        SELECT *
        FROM filtered_collections
        ORDER BY collection_date DESC
        LIMIT p_limit
        OFFSET (p_page - 1) * p_limit
    ) t;

    RETURN result;
END;
$;
