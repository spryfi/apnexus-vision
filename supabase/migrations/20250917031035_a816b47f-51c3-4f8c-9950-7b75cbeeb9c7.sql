-- Schedule the recurring transaction generator to run daily at 1 AM
SELECT cron.schedule(
  'create-recurring-transactions-daily',
  '0 1 * * *', -- Every day at 1 AM
  $$
  SELECT
    net.http_post(
        url:='https://efrzzqqtmiazlsmwprmt.supabase.co/functions/v1/create-recurring-transactions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmcnp6cXF0bWlhemxzbXdwcm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNDY1OTgsImV4cCI6MjA1NzkyMjU5OH0.bEvvlwbLBC2I7oDyWPyMF_B_d7Hkk8sTL8SvL2kFI6w"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);