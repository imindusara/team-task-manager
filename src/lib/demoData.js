export const INITIAL_PROFILES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alex Rivera',
    email: 'alex@company.com',
    role: 'manager',
    department: 'Operations & Management',
    title: 'Operations Lead & Manager',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#6366f1'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    role: 'staff',
    department: 'Engineering',
    title: 'Senior Frontend Lead',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    color: '#06b6d4'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Marcus Brody',
    email: 'marcus@company.com',
    role: 'staff',
    department: 'Engineering',
    title: 'Backend & Cloud Architect',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#8b5cf6'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Elena Rostova',
    email: 'elena@company.com',
    role: 'staff',
    department: 'People & HR',
    title: 'People Ops & HR Specialist',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#ec4899'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'David Kim',
    email: 'david@company.com',
    role: 'staff',
    department: 'Quality & Support',
    title: 'QA Lead & Support Specialist',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#10b981'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Priya Patel',
    email: 'priya@company.com',
    role: 'staff',
    department: 'Design',
    title: 'UI/UX Product Designer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#f59e0b'
  }
];

export const INITIAL_TASKS = [
  // Daily Tasks
  {
    id: 't-1',
    title: 'Morning Standup & Sprint Blocker Triage',
    description: 'Coordinate daily check-in with Sarah and Marcus regarding the new API payload contracts.',
    category: 'daily',
    priority: 'high',
    status: 'pending',
    assigned_to: '22222222-2222-2222-2222-222222222222', // Sarah
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['standup', 'engineering']
  },
  {
    id: 't-2',
    title: 'Database Automated Backup & Error Log Audit',
    description: 'Verify Postgres daily snapshot integrity and inspect Sentry exception rates.',
    category: 'daily',
    priority: 'urgent',
    status: 'completed',
    assigned_to: '33333333-3333-3333-3333-333333333333', // Marcus
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    completed_by: '33333333-3333-3333-3333-333333333333',
    completion_note: 'Verified 3 successful snapshots. All replication logs clean.',
    tags: ['devops', 'security']
  },
  {
    id: 't-3',
    title: 'Daily Support Inbox Zero & Ticket Triage',
    description: 'Clear unresolved Priority 1 customer tickets and report recurring bugs to Engineering.',
    category: 'daily',
    priority: 'medium',
    status: 'pending',
    assigned_to: '55555555-5555-5555-5555-555555555555', // David
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['support', 'qa']
  },
  {
    id: 't-4',
    title: 'Design System Component Review & Icon Audit',
    description: 'Review Lucide icon set consistency in the Figma v2.2 library with Elena.',
    category: 'daily',
    priority: 'low',
    status: 'pending',
    assigned_to: '66666666-6666-6666-6666-666666666666', // Priya
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['design', 'ui']
  },

  // Weekly Tasks
  {
    id: 't-5',
    title: 'Finish Interactive Dashboard Dark/Light Theme Tokens',
    description: 'Provide high-contrast accessible tokens and responsive breakpoints for the Q3 release.',
    category: 'weekly',
    priority: 'high',
    status: 'pending',
    assigned_to: '66666666-6666-6666-6666-666666666666', // Priya
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['design', 'tokens']
  },
  {
    id: 't-6',
    title: 'Implement Redis Caching for Realtime Team Aggregates',
    description: 'Implement key-value cache layer to speed up high-frequency dashboard analytics requests.',
    category: 'weekly',
    priority: 'high',
    status: 'pending',
    assigned_to: '33333333-3333-3333-3333-333333333333', // Marcus
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['backend', 'performance']
  },
  {
    id: 't-7',
    title: 'E2E Testing Suite for Task Assignment & State Sync',
    description: 'Write Cypress tests covering 1-click ticking and manager task assignment workflows.',
    category: 'weekly',
    priority: 'medium',
    status: 'pending',
    assigned_to: '55555555-5555-5555-5555-555555555555', // David
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['qa', 'e2e']
  },
  {
    id: 't-8',
    title: 'Component Modularization & Bundle Size Optimization',
    description: 'Refactor Tailwind dynamic classes and split vendor chunks to keep initial bundle under 150KB.',
    category: 'weekly',
    priority: 'medium',
    status: 'completed',
    assigned_to: '22222222-2222-2222-2222-222222222222', // Sarah
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    completed_by: '22222222-2222-2222-2222-222222222222',
    completion_note: 'Cut bundle size by 38% using dynamic imports.',
    tags: ['frontend', 'performance']
  },

  // HR & Department Tasks
  {
    id: 't-9',
    title: 'Q4 Annual Leave & Holiday Schedule Confirmation',
    description: 'Review holiday overlap between engineering and support team shifts for year-end coverage.',
    category: 'hr',
    priority: 'urgent',
    status: 'pending',
    assigned_to: '44444444-4444-4444-4444-444444444444', // Elena
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['hr', 'policy', 'leave']
  },
  {
    id: 't-10',
    title: 'Submit Remote Work Equipment Stipend Invoices',
    description: 'Upload hardware receipts for ergonomic chair and monitor arm to HR portal.',
    category: 'hr',
    priority: 'medium',
    status: 'pending',
    assigned_to: '22222222-2222-2222-2222-222222222222', // Sarah
    created_by: '44444444-4444-4444-4444-444444444444',
    due_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['hr', 'expenses']
  },
  {
    id: 't-11',
    title: 'Prepare Annual Team Health & Wellness Policy Update',
    description: 'Draft updated gym & mental wellness stipend guidelines for 2027.',
    category: 'hr',
    priority: 'low',
    status: 'completed',
    assigned_to: '44444444-4444-4444-4444-444444444444', // Elena
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    completed_by: '44444444-4444-4444-4444-444444444444',
    completion_note: 'Approved with management. PDF uploaded to handbook.',
    tags: ['hr', 'benefits']
  },

  // General Tasks
  {
    id: 't-12',
    title: 'Host Monthly Company Tech Sharing & Lightning Talks',
    description: 'Coordinate presentation slots for AI assisted development and modern browser debugging.',
    category: 'general',
    priority: 'low',
    status: 'pending',
    assigned_to: '11111111-1111-1111-1111-111111111111', // Alex
    created_by: '11111111-1111-1111-1111-111111111111',
    due_date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    completed_at: null,
    completed_by: null,
    completion_note: '',
    tags: ['culture', 'learning']
  }
];
