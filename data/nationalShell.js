// compiled companion for Node scripts
exports.NATIONAL_DOMAINS = [
  { id: 'custody', label: 'Custody', description: 'Who will have physical/legal custody of the child?' },
  { id: 'child_support', label: 'Child Support', description: 'Financial support for the child.' },
  { id: 'dependency_tpr', label: 'Dependency/TPR', description: 'Dependency cases and termination of parental rights.' },
  { id: 'domestic_violence', label: 'Domestic Violence', description: 'Protective orders and related issues.' },
  { id: 'procedure', label: 'Procedure', description: 'Court procedural requirements.' },
  { id: 'service_notice', label: 'Service & Notice', description: 'Proper service and notice of documents.' },
  { id: 'venue_jurisdiction', label: 'Venue & Jurisdiction', description: 'Where the case can be filed.' },
  { id: 'appeals', label: 'Appeals', description: 'Post‑trial appeals.' },
];

exports.NATIONAL_ISSUES = [
  { id: 'custody_initial', domainId: 'custody', label: 'Initial Custody Determination' },
  { id: 'custody_modification', domainId: 'custody', label: 'Custody Modification' },
  { id: 'child_support_order', domainId: 'child_support', label: 'Child Support Order' },
  { id: 'emergency_custody', domainId: 'custody', label: 'Emergency Custody' },
];

exports.NATIONAL_INTAKE = [
  { id: 'q1', domainId: 'custody', prompt: 'Are you seeking an initial custody order?', type: 'boolean', issueId: 'custody_initial' },
  { id: 'q2', domainId: 'custody', prompt: 'Do you need to modify an existing order?', type: 'boolean', issueId: 'custody_modification' },
  { id: 'q3', domainId: 'child_support', prompt: 'Is a child support order required?', type: 'boolean', issueId: 'child_support_order' },
];

exports.NATIONAL_TESTS = [
  { id: 'test_custody_initial', issueId: 'custody_initial', label: 'Best Interest of Child' },
  { id: 'test_custody_modification', issueId: 'custody_modification', label: 'Material Change in Circumstances' },
];
