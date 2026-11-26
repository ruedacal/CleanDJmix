import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { MapWorkspace } from '../../workspaces/MapWorkspace.jsx';

export { MapWorkspace };

export function IsolatedMapWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="map">
      <MapWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
