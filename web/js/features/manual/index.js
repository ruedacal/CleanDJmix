import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { InteractiveManualModal, MANUAL_SECTIONS } from '../../modals/index.js';

export { InteractiveManualModal, MANUAL_SECTIONS };

export function IsolatedInteractiveManualModal(props) {
  return (
    <FeatureErrorBoundary feature="manual">
      <InteractiveManualModal {...props} />
    </FeatureErrorBoundary>
  );
}
