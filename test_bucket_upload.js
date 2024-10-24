const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aoehzrooxxwoaskyzqcr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZWh6cm9veHh3b2Fza3l6cWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NTQyMjUsImV4cCI6MjA0NTMzMDIyNX0.l5SvNooCHyNTBYjKLXcrBAwyUxdSZNGKnqtE_zPW7Vo';
const bucketName = 'resistance-logs'

const supabase = createClient(supabaseUrl, supabaseKey);

const fs = require('fs');

const fileName = 'example.json'; // Path to your JSON file

// Read the contents of the JSON file
const fileContent = fs.readFileSync(fileName, 'utf8');

console.log(fileContent)
// Upload the JSON file to the public bucket
supabase.storage
    .from(bucketName) // Replace 'bucket name' with the name of your bucket
    .upload('example2.json', fileContent, {
        contentType: 'application/json',
    })
    .then((response) => {
        console.log('Response:', response.Key);
    })
    .catch((error) => {
        console.error('Error response:', error);
     });
