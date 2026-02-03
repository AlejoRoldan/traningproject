SELECT category, COUNT(*) as count 
FROM scenarios 
GROUP BY category 
ORDER BY category;
