INSERT INTO organizations (id, name)
VALUES ('org_northstar', 'Northstar')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO tickets (
  id, organization_id, reference, customer_name, customer_company,
  customer_initials, subject, preview, priority, status, sentiment,
  assignee, updated_at
) VALUES (
  'ticket_1048',
  'org_northstar',
  '#1048',
  'Lena Ortiz',
  'Atlas Coffee',
  'LO',
  'Team members cannot access our workspace',
  'We upgraded this morning, but the invitations still show as expired…',
  'urgent',
  'open',
  'frustrated',
  'Maya Chen',
  now()
)
ON CONFLICT (id, organization_id) DO UPDATE SET
  subject = EXCLUDED.subject,
  preview = EXCLUDED.preview,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  sentiment = EXCLUDED.sentiment,
  assignee = EXCLUDED.assignee,
  updated_at = EXCLUDED.updated_at;

INSERT INTO ticket_messages (
  id, ticket_id, organization_id, author, author_type, body, created_at
) VALUES (
  'message_1',
  'ticket_1048',
  'org_northstar',
  'Lena Ortiz',
  'customer',
  'We upgraded to Scale, but every new invitation opens an expired-link page.',
  now()
)
ON CONFLICT (id, organization_id) DO UPDATE SET
  body = EXCLUDED.body,
  created_at = EXCLUDED.created_at;

INSERT INTO knowledge (id, organization_id, title, body, source_url)
VALUES (
  'kb_invites',
  'org_northstar',
  'Resetting expired workspace invitations',
  'Administrators can revoke expired invitations and issue new links from Settings → Members.',
  '/docs/workspace-invitations'
)
ON CONFLICT (id, organization_id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  source_url = EXCLUDED.source_url;

INSERT INTO ticket_knowledge (ticket_id, knowledge_id, organization_id)
VALUES ('ticket_1048', 'kb_invites', 'org_northstar')
ON CONFLICT DO NOTHING;
