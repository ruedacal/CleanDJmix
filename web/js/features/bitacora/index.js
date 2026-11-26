import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { BitacoraModal, BitacoraDetailModal, BitacoraDetailContent } from '../../modals/index.js';
import { LogsWorkspace } from '../../workspaces/LogsWorkspace.jsx';

export { BitacoraModal, BitacoraDetailModal, BitacoraDetailContent, LogsWorkspace };

export function IsolatedBitacoraModal(props) {
  return (
    <FeatureErrorBoundary feature="bitacora">
      <BitacoraModal {...props} />
    </FeatureErrorBoundary>
  );
}
