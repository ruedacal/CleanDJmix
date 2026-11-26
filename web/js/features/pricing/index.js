import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { PricingModal } from '../../shell/pricing-modal.jsx';

export { PricingModal };

export function IsolatedPricingModal(props) {
  return (
    <FeatureErrorBoundary feature="pricing">
      <PricingModal {...props} />
    </FeatureErrorBoundary>
  );
}
