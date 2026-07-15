import { createClient } from '@supabase/supabase-js'

// Env vars set in Vercel dashboard:
//   VITE_SUPABASE_URL      — same as your frontend
//   SUPABASE_SERVICE_KEY   — service role key (Settings → API in Supabase)
//   SMS_WEBHOOK_TOKEN      — any long random string you choose as a secret

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const SMS_TOKEN = process.env.SMS_WEBHOOK_TOKEN

// ── Auto-categorization rules ─────────────────────────────────────────────────
// Keywords matched against merchant name + full SMS text (case-insensitive).
// Order matters — first match wins.
const CATEGORY_RULES = [
  {
    category: 'Dining Out',
    keywords: ['zomato', 'swiggy', 'foodpanda', 'dominos', "domino's", 'mcdonalds', "mcdonald's",
      'kfc', 'pizza hut', 'burger king', 'chaayos', 'cafe coffee day', 'starbucks',
      'restaurant', 'dhaba', 'bistro', 'eatery', 'diner'],
  },
  {
    category: 'Grocery',
    keywords: ['bigbasket', 'grofers', 'blinkit', 'dunzo', 'zepto', 'dmart', 'd-mart',
      'reliance fresh', 'more supermarket', 'supermarket', 'grocery', 'kirana', 'vegetables',
      'fruits', 'spar', 'lulu hypermarket'],
  },
  {
    category: 'Transport / Fuel',
    keywords: ['uber', 'ola cab', 'rapido', 'nammayatri', 'petrol', 'diesel', 'fuel',
      'indian oil', 'iocl', 'hpcl', 'bpcl', 'hp petrol', 'cng station', 'metro rail',
      'irctc', 'makemytrip', 'goibibo', 'redbus', 'yatra', 'indigo airlines', 'spicejet',
      'air india', 'vistara', 'akasa', 'parking'],
  },
  {
    category: 'Medical',
    keywords: ['pharmacy', 'medical store', 'hospital', 'clinic', 'apollo pharmacy',
      'practo', 'netmeds', '1mg', 'pharmeasy', 'medplus', 'health', 'doctor',
      'nursing home', 'diagnostic', 'pathology', 'medico', 'fortis', 'max hospital'],
  },
  {
    category: 'Electricity',
    keywords: ['electricity', 'power bill', 'electric bill', 'bescom', 'tata power',
      'adani electricity', 'msedcl', 'tneb', 'cesc', 'wbsedcl', 'bses', 'mseb',
      'apseb', 'tangedco', 'jvvnl', 'pvvnl', 'uppcl'],
  },
  {
    category: 'Subscriptions',
    keywords: ['netflix', 'primevideo', 'amazon prime', 'spotify', 'hotstar', 'disney+',
      'jiocinema', 'youtube premium', 'google one', 'apple subscription', 'linkedin',
      'microsoft 365', 'adobe', 'recharge', 'postpaid', 'broadband', 'internet bill',
      'jio fiber', 'airtel broadband', 'act fibernet'],
  },
  {
    category: 'Electronics / Gadgets',
    keywords: ['croma', 'vijay sales', 'reliance digital', 'electronics', 'samsung store',
      'apple store', 'xiaomi', 'oneplus store', 'laptop', 'mobile store'],
  },
  {
    category: 'Personal Care',
    keywords: ['salon', 'spa', 'haircut', 'parlour', 'beauty', 'nykaa', 'grooming',
      'lakmé', 'lakme', 'waxing', 'barber', 'manicure', 'pedicure'],
  },
  {
    category: 'Clothes',
    keywords: ['myntra', 'ajio', 'fabindia', 'westside', 'max fashion', 'zara', 'h&m',
      'clothing', 'fashion', 'apparel', 'garment', 'textile', 'shirt shop',
      'pantaloons', 'lifestyle stores'],
  },
  {
    category: 'Accessories',
    keywords: ['jewellery', 'jewelry', 'tanishq', 'malabar gold', 'senco', 'kalyan',
      'watch store', 'sunglasses', 'bag store', 'accessory'],
  },
  {
    category: 'Festival / Gifts',
    keywords: ['gift shop', 'flowers', 'bouquet', 'ferns n petals', 'fnp', 'archies',
      'birthday gift', 'anniversary gift', 'decoration'],
  },
]

function categorize(merchant, fullSms) {
  const haystack = (merchant + ' ' + fullSms).toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => haystack.includes(kw))) return rule.category
  }
  return 'Miscellaneous'
}

// ── SMS parser ────────────────────────────────────────────────────────────────
function parseSMS(text) {
  // Must contain an amount (Rs., INR, or ₹)
  const amountMatch = text.match(/(?:Rs\.?\s*|INR\s*|₹\s*)([\d,]+(?:\.\d{1,2})?)/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null
  if (!amount || amount <= 0) return null

  // Must be a debit transaction
  if (!/debit|debited|paid|payment|spent|sent|purchase|withdraw/i.test(text)) return null

  // Skip credits and refunds
  if (/credited\s+(?:to\s+your|to\s+a\/c|in\s+your)|refund(?:ed)?|reversal|cashback/i.test(text)) return null

  // ── Merchant extraction (try multiple patterns) ───────────────────────────

  let merchant = ''

  // "to VPA name@bank" — most UPI SMS
  const vpaMatch = text.match(/to\s+(?:VPA\s+)?([A-Za-z0-9._-]+)@[A-Za-z0-9._-]+/i)
  if (vpaMatch) {
    merchant = vpaMatch[1].replace(/[._-]+/g, ' ').trim()
  }

  // "at MERCHANT on/via" — Paytm / Google Pay style
  if (!merchant || merchant.length < 2) {
    const atMatch = text.match(/\bat\s+([A-Za-z][A-Za-z0-9\s&.,'/-]{2,40}?)(?:\s+on\b|\s+via\b|\s+UPI\b|\s+Ref\b|[.,]|$)/i)
    if (atMatch) merchant = atMatch[1].trim()
  }

  // "to MERCHANT on/via" — HDFC / Axis style
  if (!merchant || merchant.length < 2) {
    const toMatch = text.match(/\bto\s+([A-Za-z][A-Za-z0-9\s&.,'/-]{2,40}?)(?:\s+on\b|\s+via\b|\s+UPI\b|\s+Ref\b|[.,]|$)/i)
    if (toMatch) merchant = toMatch[1].trim()
  }

  // ── Date extraction ───────────────────────────────────────────────────────

  let date = new Date().toISOString().split('T')[0]

  // DD-MM-YYYY or DD/MM/YYYY or DD-MM-YY
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (dateMatch) {
    const [, d, m, y] = dateMatch
    const fullYear = y.length === 2 ? `20${y}` : y
    const candidate = `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    if (!isNaN(new Date(candidate))) date = candidate
  }

  const dateObj = new Date(date)
  const month = dateObj.getMonth() + 1
  const year = dateObj.getFullYear()

  // ── UPI reference number ──────────────────────────────────────────────────

  const refMatch = text.match(
    /(?:UPI\s*Ref\.?(?:\s*No\.?)?|Ref\.?(?:\s*No\.?)?|Txn\.?\s*Id\.?|RRN)\s*:?\s*(\d{6,})/i
  )
  const upiRef = refMatch ? refMatch[1] : null

  const cleanMerchant = merchant.trim() || 'UPI Payment'
  const particular = upiRef
    ? `${cleanMerchant} (Ref: …${upiRef.slice(-6)})`
    : cleanMerchant

  const category = categorize(cleanMerchant, text)

  return { amount, merchant: cleanMerchant, particular, date, month, year, category }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Allow CORS for local testing
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sms, token, user_id } = req.body ?? {}

  // Auth check
  if (!SMS_TOKEN) return res.status(500).json({ error: 'SMS_WEBHOOK_TOKEN not configured on server' })
  if (token !== SMS_TOKEN) return res.status(401).json({ error: 'Invalid token' })
  if (!sms) return res.status(400).json({ error: 'sms field required' })
  if (!user_id) return res.status(400).json({ error: 'user_id field required' })

  // Parse the SMS
  const parsed = parseSMS(sms)
  if (!parsed) {
    return res.status(200).json({ skipped: true, reason: 'Not a debit SMS or no amount found' })
  }

  // Supabase service client (bypasses RLS — safe because we auth with our own token)
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase env vars not configured on server' })
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Insert line item into planner_expense_items
  const { error: insertErr } = await supabase
    .from('planner_expense_items')
    .insert({
      user_id,
      year: parsed.year,
      month: parsed.month,
      category: parsed.category,
      entry_date: parsed.date,
      particular: parsed.particular,
      amount: parsed.amount,
      source: 'sms',
    })

  if (insertErr) return res.status(500).json({ error: insertErr.message })

  // Recompute total for this category+month and upsert into planner_expenses
  const { data: items } = await supabase
    .from('planner_expense_items')
    .select('amount')
    .eq('user_id', user_id)
    .eq('year', parsed.year)
    .eq('month', parsed.month)
    .eq('category', parsed.category)

  const newTotal = (items ?? []).reduce((s, i) => s + Number(i.amount), 0)

  await supabase
    .from('planner_expenses')
    .upsert(
      { user_id, year: parsed.year, month: parsed.month, category: parsed.category, amount: newTotal },
      { onConflict: 'user_id,year,month,category' }
    )

  return res.status(200).json({
    success: true,
    category: parsed.category,
    amount: parsed.amount,
    merchant: parsed.merchant,
    date: parsed.date,
  })
}
