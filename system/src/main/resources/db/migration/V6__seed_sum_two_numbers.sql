INSERT INTO problems (slug, title, description, constraints_text, difficulty)
SELECT 'sum-two-numbers', 'Sum of Two Numbers',
       'Read two integers and print their sum.',
       'Each input contains two integers. Values fit in a signed 64-bit integer.',
       'EASY'
WHERE NOT EXISTS (
    SELECT 1 FROM problems WHERE slug = 'sum-two-numbers'
);

INSERT INTO problem_examples (problem_id, example_number, input_text, output_text, explanation)
SELECT p.id, 1, '2 3', '5', 'Add the two input integers.'
FROM problems p
WHERE p.slug = 'sum-two-numbers'
  AND NOT EXISTS (
      SELECT 1 FROM problem_examples e
      WHERE e.problem_id = p.id AND e.example_number = 1
  );

INSERT INTO problem_test_cases (problem_id, input_text, expected_output, is_hidden)
SELECT p.id, cases.input_text, cases.expected_output, TRUE
FROM problems p
JOIN (
    SELECT '2 3' AS input_text, '5' AS expected_output UNION ALL
    SELECT '-4 7', '3' UNION ALL
    SELECT '0 0', '0' UNION ALL
    SELECT '100000 250000', '350000' UNION ALL
    SELECT '-12 -8', '-20' UNION ALL
    SELECT '999999999 1', '1000000000'
) cases
LEFT JOIN problem_test_cases existing
  ON existing.problem_id = p.id
 AND existing.input_text = cases.input_text
 AND existing.expected_output = cases.expected_output
WHERE p.slug = 'sum-two-numbers'
  AND existing.id IS NULL;
