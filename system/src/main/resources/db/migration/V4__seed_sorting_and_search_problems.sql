INSERT INTO problems (slug, title, description, constraints_text, difficulty) VALUES
('bubble-sort', 'Bubble Sort', 'Sort an array of integers in ascending order using the bubble sort algorithm.', '1 <= n <= 1000; -100000 <= values[i] <= 100000', 'EASY'),
('selection-sort', 'Selection Sort', 'Sort an array of integers in ascending order using the selection sort algorithm.', '1 <= n <= 1000; -100000 <= values[i] <= 100000', 'EASY'),
('insertion-sort', 'Insertion Sort', 'Sort an array of integers in ascending order using the insertion sort algorithm.', '1 <= n <= 1000; -100000 <= values[i] <= 100000', 'EASY'),
('merge-sort', 'Merge Sort', 'Sort an array of integers in ascending order using merge sort.', '1 <= n <= 100000; -1000000000 <= values[i] <= 1000000000', 'MEDIUM'),
('quick-sort', 'Quick Sort', 'Sort an array of integers in ascending order using quick sort.', '1 <= n <= 100000; -1000000000 <= values[i] <= 1000000000', 'MEDIUM'),
('binary-search', 'Binary Search', 'Given a sorted array and a target, print any index containing the target, or -1 if it is absent. Use zero-based indexing.', '0 <= n <= 100000; array is sorted in nondecreasing order', 'EASY'),
('first-occurrence', 'First Occurrence in a Sorted Array', 'Given a sorted array and a target, print the index of its first occurrence, or -1 if it is absent. Use zero-based indexing.', '0 <= n <= 100000; array is sorted in nondecreasing order', 'MEDIUM'),
('search-insert-position', 'Search Insert Position', 'Given a sorted array and a target, print the index where it is found or should be inserted to keep the array sorted. Use zero-based indexing.', '0 <= n <= 100000; array is sorted in strictly increasing order', 'EASY')
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

INSERT INTO problem_examples (problem_id, example_number, input_text, output_text, explanation)
SELECT p.id, 1, '5 5 1 4 2 8', '1 2 4 5 8', 'Print the values in ascending order.'
FROM problems p WHERE p.slug IN ('bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort')
AND NOT EXISTS (SELECT 1 FROM problem_examples e WHERE e.problem_id = p.id AND e.example_number = 1);
INSERT INTO problem_examples (problem_id, example_number, input_text, output_text, explanation)
SELECT p.id, 1, '6 1 3 5 7 9 11 7', '3', 'The target 7 is at zero-based index 3.'
FROM problems p WHERE p.slug = 'binary-search'
AND NOT EXISTS (SELECT 1 FROM problem_examples e WHERE e.problem_id = p.id AND e.example_number = 1);
INSERT INTO problem_examples (problem_id, example_number, input_text, output_text, explanation)
SELECT p.id, 1, '7 1 2 2 2 4 7 9 2', '1', 'The first occurrence of 2 is at index 1.'
FROM problems p WHERE p.slug = 'first-occurrence'
AND NOT EXISTS (SELECT 1 FROM problem_examples e WHERE e.problem_id = p.id AND e.example_number = 1);
INSERT INTO problem_examples (problem_id, example_number, input_text, output_text, explanation)
SELECT p.id, 1, '4 1 3 5 6 2', '1', 'The value 2 belongs at index 1.'
FROM problems p WHERE p.slug = 'search-insert-position'
AND NOT EXISTS (SELECT 1 FROM problem_examples e WHERE e.problem_id = p.id AND e.example_number = 1);

INSERT INTO problem_test_cases (problem_id, input_text, expected_output, is_hidden)
SELECT p.id, cases.input_text, cases.expected_output, TRUE
FROM problems p
JOIN (
    SELECT 'bubble-sort' AS slug, '5 5 1 4 2 8' AS input_text, '1 2 4 5 8' AS expected_output UNION ALL
    SELECT 'bubble-sort', '6 3 -1 0 3 2 -5', '-5 -1 0 2 3 3' UNION ALL
    SELECT 'bubble-sort', '1 42', '42' UNION ALL
    SELECT 'bubble-sort', '4 7 7 7 7', '7 7 7 7' UNION ALL
    SELECT 'selection-sort', '5 5 1 4 2 8', '1 2 4 5 8' UNION ALL
    SELECT 'selection-sort', '6 3 -1 0 3 2 -5', '-5 -1 0 2 3 3' UNION ALL
    SELECT 'selection-sort', '1 42', '42' UNION ALL
    SELECT 'selection-sort', '4 7 7 7 7', '7 7 7 7' UNION ALL
    SELECT 'insertion-sort', '5 5 1 4 2 8', '1 2 4 5 8' UNION ALL
    SELECT 'insertion-sort', '6 3 -1 0 3 2 -5', '-5 -1 0 2 3 3' UNION ALL
    SELECT 'insertion-sort', '1 42', '42' UNION ALL
    SELECT 'insertion-sort', '4 7 7 7 7', '7 7 7 7' UNION ALL
    SELECT 'merge-sort', '5 5 1 4 2 8', '1 2 4 5 8' UNION ALL
    SELECT 'merge-sort', '6 3 -1 0 3 2 -5', '-5 -1 0 2 3 3' UNION ALL
    SELECT 'merge-sort', '1 42', '42' UNION ALL
    SELECT 'merge-sort', '4 7 7 7 7', '7 7 7 7' UNION ALL
    SELECT 'quick-sort', '5 5 1 4 2 8', '1 2 4 5 8' UNION ALL
    SELECT 'quick-sort', '6 3 -1 0 3 2 -5', '-5 -1 0 2 3 3' UNION ALL
    SELECT 'quick-sort', '1 42', '42' UNION ALL
    SELECT 'quick-sort', '4 7 7 7 7', '7 7 7 7' UNION ALL
    SELECT 'binary-search', '6 1 3 5 7 9 11 7', '3' UNION ALL
    SELECT 'binary-search', '5 -8 -2 0 4 10 6', '-1' UNION ALL
    SELECT 'binary-search', '0 5', '-1' UNION ALL
    SELECT 'binary-search', '1 42 42', '0' UNION ALL
    SELECT 'first-occurrence', '7 1 2 2 2 4 7 9 2', '1' UNION ALL
    SELECT 'first-occurrence', '5 -3 0 4 8 12 8', '3' UNION ALL
    SELECT 'first-occurrence', '4 1 3 5 7 2', '-1' UNION ALL
    SELECT 'first-occurrence', '0 9', '-1' UNION ALL
    SELECT 'search-insert-position', '4 1 3 5 6 2', '1' UNION ALL
    SELECT 'search-insert-position', '4 1 3 5 6 5', '2' UNION ALL
    SELECT 'search-insert-position', '4 1 3 5 6 7', '4' UNION ALL
    SELECT 'search-insert-position', '4 1 3 5 6 0', '0' UNION ALL
    SELECT 'search-insert-position', '0 10', '0' UNION ALL
    SELECT 'sum-two-numbers', '2 3', '5' UNION ALL
    SELECT 'sum-two-numbers', '-4 7', '3' UNION ALL
    SELECT 'sum-two-numbers', '0 0', '0' UNION ALL
    SELECT 'sum-two-numbers', '100000 250000', '350000' UNION ALL
    SELECT 'sum-two-numbers', '-12 -8', '-20' UNION ALL
    SELECT 'sum-two-numbers', '999999999 1', '1000000000' UNION ALL
    SELECT 'reverse-string', 'hello', 'olleh' UNION ALL
    SELECT 'reverse-string', 'a', 'a' UNION ALL
    SELECT 'reverse-string', 'two words', 'sdrow owt' UNION ALL
    SELECT 'reverse-string', '12345', '54321' UNION ALL
    SELECT 'reverse-string', 'racecar', 'racecar'
) cases ON cases.slug = p.slug
LEFT JOIN problem_test_cases existing
  ON existing.problem_id = p.id
 AND existing.input_text = cases.input_text
 AND existing.expected_output = cases.expected_output
WHERE existing.id IS NULL;
