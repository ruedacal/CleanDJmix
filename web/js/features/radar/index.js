import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { TrendsWorkspace } from '../../workspaces/TrendsWorkspace.jsx';

export { TrendsWorkspace };

export function IsolatedRadarWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="radar">
      <TrendsWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
