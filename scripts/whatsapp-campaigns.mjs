// WhatsApp campaigns sent by scripts/whatsapp-messages.mjs.
//
// Each campaign is tracked in its own Sheets tab (created on first
// `prepare`) and maps a guest's rsvp_status to an approved Meta template.
// This map is the single source of truth for who gets a message: any status
// not listed here (including a blank one) is excluded as
// `campaign not configured`. Every template currently takes exactly one body
// variable — {{1}} = greeting_name.

export const CAMPAIGNS = {
  reminder_1_month: {
    tab: 'WA_reminder_1_month',
    language: 'en',
    templates: {
      attending_both: 'wedding_reminder_both_v2',
      attending_5th: 'wedding_reminder_reception',
    },
  },
  test: {
    tab: 'WA_TEST_1',
    language: 'en',
    templates: {
      attending_both: 'wedding_reminder_both_v2',
      attending_5th: 'wedding_reminder_reception',
    },
  },
};
