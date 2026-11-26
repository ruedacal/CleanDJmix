import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { TrendsWorkspace } from '../../workspaces/TrendsWorkspace.jsx';

export { TrendsWorkspace };

export function IsolatedTrendsWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="trends">
      <TrendsWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
