   CREATE OR REPLACE FUNCTION get_examinees_by_roll_range(p_start_roll integer, p_end_roll integer)
 RETURNS TABLE(
     id uuid,
     name_bn text,
     roll_number integer,
     exam_id uuid,
     marhala_id uuid,
     marhala_name text,
     kitabs json,
        marks json
    ) AS $$
    BEGIN
        RETURN QUERY
        WITH examinee_kitabs AS (
            SELECT
                e.id as examinee_id,
                e.exam_id as exam_id,
                m.id as marhala_id,
                m.name_bn as marhala_name,
                json_agg(json_build_object('id', k.id, 'name_bn', k.name_bn, 'full_marks', k.full_marks)) as kitabs      
            FROM examinees e
            JOIN marhalas m ON e.marhala_id = m.id
            JOIN kitabs k ON k.id = ANY(m.kitab_ids)
            WHERE e.roll_number BETWEEN p_start_roll AND p_end_roll
            GROUP BY e.id, m.id, m.name_bn
        ),
        examinee_marks AS (
            SELECT
                em.examinee_id,
                json_object_agg(em.kitab_id, json_build_object('value', em.obtained_marks, 'status', em.status)) as marks
            FROM marks em
            WHERE em.examinee_id IN (SELECT examinee_id FROM examinee_kitabs)
            GROUP BY em.examinee_id
        )
        SELECT
            e.id,
            e.name_bn,
            e.roll_number,
            e.exam_id,
            ek.marhala_id,
            ek.marhala_name,
            ek.kitabs,
            COALESCE(emk.marks, '{}'::json) as marks
        FROM examinees e
        JOIN examinee_kitabs ek ON e.id = ek.examinee_id
        LEFT JOIN examinee_marks emk ON e.id = emk.examinee_id
        WHERE e.roll_number BETWEEN p_start_roll AND p_end_roll
        ORDER BY e.roll_number;
    END;
    $$ LANGUAGE plpgsql;