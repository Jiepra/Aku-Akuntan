import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvmmntghpzcdvyulzcal.supabase.co'; // ← ganti sesuai project Anda
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bW1udGdocHpjZHZ5dWx6Y2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzA0ODYsImV4cCI6MjA2NTkwNjQ4Nn0.hKYYExvI4BgjtzLPUjjLBIqzRRoreFBdNeHxzwOPy94';               // ← ganti sesuai Supabase Anda

export const supabase = createClient(supabaseUrl, supabaseAnonKey);