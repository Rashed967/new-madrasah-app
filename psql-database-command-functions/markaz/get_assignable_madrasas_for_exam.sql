CREATE OR REPLACE FUNCTION get_assignable_madrasas_for_exam(
    p_exam_id UUID,
    p_page INT,
    p_limit INT,
    p_zone_id UUID DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL,
    p_madrasa_types TEXT[] DEFAULT NULL
)
RETURNS TABLE(
    madrasa_id UUID,
    madrasa_name_bn TEXT,
    madrasa_code INT,
    madrasa_type TEXT,
    assignable_marhalas JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    offset_val INT;
BEGIN
    offset_val := (p_page - 1) * p_limit;

    RETURN QUERY
    WITH madrasa_marhalas AS (
        SELECT
            m.id AS madrasa_id,
            m.name_bn AS madrasa_name_bn,
            m.madrasa_code AS madrasa_code,
            m.type AS madrasa_type,
            jsonb_agg(
                jsonb_build_object(
                    'marhala_id', mh.id,
                    'marhala_name_bn', mh.name_bn,
                    'marhala_type', mh.type,
                    'marhala_category', mh.category
                )
            ) FILTER (WHERE NOT EXISTS (
                SELECT 1
                FROM markaz_madrasa_marhala_assignments mma
                WHERE mma.madrasa_id = m.id AND mma.marhala_id = mh.id AND mma.exam_id = p_exam_id
            )) AS assignable_marhalas
        FROM
            madrasas m
        JOIN
            marhalas mh ON (m.type = 'both' OR m.type = mh.type)
        WHERE
            (p_zone_id IS NULL OR m.zone_id = p_zone_id)
            AND (p_search_term IS NULL OR m.name_bn ILIKE '%' || p_search_term || '%' OR m.madrasa_code::TEXT ILIKE '%' || p_search_term || '%')
            AND (p_madrasa_types IS NULL OR m.type = ANY(p_madrasa_types))
        GROUP BY m.id, m.name_bn, m.madrasa_code, m.type
    )
    SELECT
        mm.madrasa_id,
        mm.madrasa_name_bn,
        mm.madrasa_code,
        mm.madrasa_type,
        mm.assignable_marhalas
    FROM
        madrasa_marhalas mm
    WHERE
        mm.assignable_marhalas IS NOT NULL AND jsonb_array_length(mm.assignable_marhalas) > 0
    ORDER BY
        mm.madrasa_name_bn
    LIMIT
        p_limit
    OFFSET
        offset_val;
END;
$$;