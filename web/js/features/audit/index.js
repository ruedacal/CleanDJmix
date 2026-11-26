import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { AuditWorkspace } from '../../workspaces/AuditWorkspace.jsx';

export { AuditWorkspace };

export function IsolatedAuditWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="audit">
      <AuditWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
