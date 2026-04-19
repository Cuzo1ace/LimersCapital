import PortfolioUpload from './PortfolioUpload';
import OverlapPanel from './OverlapPanel';

export default function PortfolioPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-5">
        <PortfolioUpload />
      </div>
      <div className="lg:col-span-7">
        <OverlapPanel />
      </div>
    </div>
  );
}
