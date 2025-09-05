CREATE OR REPLACE FUNCTION get_madrasahs_for_script_distribution(
     p_exam_id uuid,
     p_marhala_id uuid,
     p_kitab_id uuid
 )
 RETURNS TABLE(
     value uuid,
     label text,
     code text
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT DISTINCT
            m.id AS value,
            m.name_bn AS label,
            m.madrasa_code::text AS code -- Cast to text
        FROM
            examinees e
        JOIN
            madrasas m ON e.madrasa_id = m.id
        JOIN
            marhalas mar ON e.marhala_id = mar.id -- Join with marhalas table
        WHERE
            e.exam_id = p_exam_id AND
            e.marhala_id = p_marhala_id AND
            p_kitab_id = ANY(mar.kitab_ids); -- Check if p_kitab_id is in mar.kitab_ids
    END;
    $$ LANGUAGE plpgsql;