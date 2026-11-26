import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { UserAccountModal } from '../../modals/index.js';

export { UserAccountModal };

export function IsolatedUserAccountModal(props) {
  return (
    <FeatureErrorBoundary feature="login">
      <UserAccountModal {...props} />
    </FeatureErrorBoundary>
  );
}
