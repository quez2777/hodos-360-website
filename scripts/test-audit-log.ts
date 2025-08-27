import { supabaseAdmin } from '../lib/supabase'

async function run() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment before running this script.')
    process.exit(1)
  }

  const payload = {
    action: 'test_insert',
    user_id: 'test-user',
    document_id: 'test-doc-1',
    filename: 'test.pdf',
    file_hash: 'abc123',
    virus_scan_result: { scanned: true, status: 'clean' },
    timestamp: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin.from('audit_logs').insert(payload).select()
  if (error) {
    console.error('Insert failed:', error)
    process.exit(1)
  }

  console.log('Insert succeeded:', data)
  process.exit(0)
}

run()
