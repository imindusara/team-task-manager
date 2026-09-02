export const TEAM_MEMBERS = [
  {
    id: 'b8807887-5805-4005-bea3-c77ec4472543',
    full_name: 'Ashan Indusara',
    username: 'ashan',
    email: 'ashan@company.com',
    department: 'HR',
    role: 'admin',
    avatar_url: '/Ashan.png',
    color: '#6366f1'
  },
  {
    id: '3b3b123b-a606-4a0e-a740-d6971398b4da',
    full_name: 'Widura Bandara',
    username: 'widura',
    email: 'widura@company.com',
    department: 'HR',
    role: 'admin',
    avatar_url: '/widura.png',
    color: '#8b5cf6'
  },
  {
    id: '5104abf7-3390-4271-af10-bab94bf26816',
    full_name: 'Sahan',
    username: 'sahan',
    email: 'sahan@company.com',
    department: 'Financial',
    role: 'member',
    avatar_url: '/sahan.png',
    color: '#10b981'
  },
  {
    id: '276585a2-6b0c-45b7-8840-7dbd2b714730',
    full_name: 'Sadeepa',
    username: 'sadeepa',
    email: 'sadeepa@company.com',
    department: 'Production team',
    role: 'member',
    avatar_url: '/sadeepa.png',
    color: '#06b6d4'
  },
  {
    id: 'bc767381-0864-48c0-b004-6f0037dc8e02',
    full_name: 'Pulasthi',
    username: 'pulasthi',
    email: 'pulasthi@company.com',
    department: 'Production team',
    role: 'member',
    avatar_url: '/pulasthi.png',
    color: '#3b82f6'
  },
  {
    id: 'eb683a86-5664-43c9-9bd8-6590cf01d81a',
    full_name: 'Subodha',
    username: 'subodha',
    email: 'subodha@company.com',
    department: 'Marketing',
    role: 'member',
    avatar_url: '/subodha.png',
    color: '#ec4899'
  }
];

export const getDepartmentBadge = (dept) => {
  switch (dept) {
    case 'HR':
      return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
    case 'Financial':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Production team':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    case 'Marketing':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  }
};

export const PROJECT_TYPES = [
  'Web Development',
  'Social Media Management',
  'Video Production',
  'Branding/Design',
  'Marketing Campaign'
];

export const PROJECT_STATUSES = [
  'In Progress',
  'In Review',
  'Completed',
  'Planning',
  'On Hold'
];

export const getProjectTypeBadge = (type) => {
  switch (type) {
    case 'Web Development':
      return {
        label: 'Web Development',
        icon: '🌐',
        badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
      };
    case 'Social Media Management':
      return {
        label: 'Social Media Management',
        icon: '📱',
        badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30'
      };
    case 'Video Production':
      return {
        label: 'Video Production',
        icon: '🎬',
        badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      };
    case 'Branding/Design':
      return {
        label: 'Branding/Design',
        icon: '🎨',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    case 'Marketing Campaign':
      return {
        label: 'Marketing Campaign',
        icon: '🚀',
        badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
      };
    default:
      return {
        label: type || 'Client Project',
        icon: '📁',
        badge: 'bg-slate-800 text-slate-300 border-slate-700'
      };
  }
};

export const getProjectStatusBadge = (status) => {
  switch (status) {
    case 'In Progress':
      return {
        label: 'In Progress',
        dot: 'bg-emerald-400',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    case 'In Review':
      return {
        label: 'In Review',
        dot: 'bg-amber-400',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    case 'Completed':
      return {
        label: 'Completed',
        dot: 'bg-sky-400',
        badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
      };
    case 'Planning':
      return {
        label: 'Planning',
        dot: 'bg-purple-400',
        badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      };
    case 'On Hold':
      return {
        label: 'On Hold',
        dot: 'bg-rose-400',
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      };
    default:
      return {
        label: status || 'Active',
        dot: 'bg-slate-400',
        badge: 'bg-slate-800 text-slate-300 border-slate-700'
      };
  }
};
