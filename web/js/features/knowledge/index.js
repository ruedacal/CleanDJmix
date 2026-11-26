import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { KnowledgeWorkspace } from '../../workspaces/KnowledgeWorkspace.jsx';

export { KnowledgeWorkspace };

export function IsolatedKnowledgeWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="knowledge">
      <KnowledgeWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
