-- Replace the malformed reverse-string example with raw stdin text, not a code assignment.
DELETE test_case
FROM problem_test_cases test_case
JOIN problems problem ON problem.id = test_case.problem_id
WHERE problem.slug = 'reverse-string'
  AND (test_case.input_text = 'text = "hello"'
       OR test_case.expected_output = '"olleh"');

INSERT INTO problem_test_cases (problem_id, input_text, expected_output, is_hidden)
SELECT problem.id, 'hello', 'olleh', TRUE
FROM problems problem
WHERE problem.slug = 'reverse-string'
  AND NOT EXISTS (
      SELECT 1
      FROM problem_test_cases test_case
      WHERE test_case.problem_id = problem.id
        AND test_case.input_text = 'hello'
        AND test_case.expected_output = 'olleh'
  );
