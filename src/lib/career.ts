export type CareerEntry = {
  role: string;
  company: string;
  start: string;       // 'YYYY-MM'
  end: string | 'present';
  bullets: string[];
  stack: string[];
};

export const career: CareerEntry[] = [
  {
    role: 'Software Engineer',
    company: 'Heureka Group',
    start: '2026-01',
    end: 'present',
    bullets: [
      'Designing and implementing IAM solutions — secure, scalable systems bridging internal and external services in the Heureka ecosystem.',
      'Security, token-based authorization, API integrations.',
      'System reliability via Grafana, Loki, Sentry.',
      'Advocate for refactoring, documentation, and automated testing.',
    ],
    stack: ['Python', 'TypeScript', 'Docker', 'Kubernetes', 'Terraform', 'GCP', 'MongoDB', 'MySQL', 'GitLab CI/CD'],
  },
  {
    role: 'Lecturer (volunteer)',
    company: 'PyLadies CZ',
    start: '2023-05',
    end: 'present',
    bullets: [
      'Teaching women and girls Python fundamentals and basics of programming.',
      'Iteratively improving curriculum with modern tooling and best practices.',
      'Building a more diverse Czech tech community.',
    ],
    stack: ['Python', 'Algorithms', 'Mentoring'],
  },
  {
    role: 'Test Automation Engineer',
    company: 'GK Software',
    start: '2025-06',
    end: '2026-01',
    bullets: [
      'Implemented and maintained automated test solutions for enterprise products.',
      'Improved test coverage and collaborated with dev + QA.',
    ],
    stack: ['Test Automation', 'QA', 'QFT'],
  },
  {
    role: 'Python Trainee',
    company: 'Orgis IT',
    start: '2025-02',
    end: '2025-06',
    bullets: [
      'Three-month internship focused on modern technologies and backend development in Python.',
    ],
    stack: ['Python', 'PostgreSQL','Odoo', 'Git', 'Linux'],
  },
  {
    role: 'C++ Developer & IT Consultant',
    company: 'Medicalc software',
    start: '2024-09',
    end: '2025-02',
    bullets: [
      'Hospital information system development in C++.',
      'Participation in the implementation of our system in medical facilities.',
      'Earlier: manual tester and consultant,requirements analysis, customer-facing implementation,',
    ],
    stack: ['C++', 'PostgreSQL', 'Integration Testing'],
  },
  {
    role: 'Pharmaceutical Technician',
    company: 'Plzeňská lékárna k.s. - Lipová lékárna',
    start: '2018-07',
    end: '2024-09',
    bullets: [
      'Six years preparing medicines, supporting patients, running a small lab.',
      'Wrote a Python tool (during PyLadies advanced course) automating pharmacy price tags — the career pivot into tech.',
    ],
    stack: ['Pharmacy', 'IPLP', 'Python (early)'],
  },
];
