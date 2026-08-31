import { WholesaleRowProduct } from "@/data/wholesaleRowProducts";

interface WholesaleRowTableProps {
  title: string;
  subtitle?: string;
  products: WholesaleRowProduct[];
  countryCode?: string;
}

const WholesaleRowTable = ({ title, subtitle, products, countryCode }: WholesaleRowTableProps) => {
  // No filtering - show all prices
  const filterPricesByCountry = (prices: Record<string, number>) => {
    return prices;
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-center px-2 sm:px-4">
        <h2 className="text-3xl font-bold text-wholesale-primary tracking-wider">
          {title}
          {subtitle && <span className="block text-xl mt-1">{subtitle}</span>}
        </h2>
      </div>

      <div className="w-screen relative left-[50%] right-[50%] -mx-[50vw] overflow-x-auto">
        <div className="min-w-full px-4 sm:px-6 lg:px-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-wholesale-primary/20">
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4 whitespace-nowrap">NAME</th>
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4">ORIGIN</th>
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4">PRODUCER</th>
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4">ESTATE</th>
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4">VARIETAL</th>
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4">PROCESS</th>
                <th className="text-wholesale-primary font-semibold text-left py-3 px-4">SENSORY</th>
                <th className="text-wholesale-primary font-semibold text-right py-3 px-4 whitespace-nowrap">100G</th>
                <th className="text-wholesale-primary font-semibold text-right py-3 px-4 whitespace-nowrap">200G</th>
                <th className="text-wholesale-primary font-semibold text-right py-3 px-4 whitespace-nowrap">250G</th>
                <th className="text-wholesale-primary font-semibold text-right py-3 px-4 whitespace-nowrap">1KG</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                const filteredPrices = filterPricesByCountry(product.prices);
                
                return (
                  <tr key={index} className="border-b border-wholesale-primary/10 hover:bg-wholesale-primary/5 transition-colors">
                    <td className="font-medium text-wholesale-secondary py-3 px-4 whitespace-nowrap">
                      {product.name}
                    </td>
                    <td className="text-wholesale-secondary py-3 px-4">
                      {product.origin.toUpperCase()}
                    </td>
                    <td className="text-wholesale-secondary py-3 px-4">
                      {product.producer.toUpperCase()}
                    </td>
                    <td className="text-wholesale-secondary py-3 px-4">
                      {product.estate || '-'}
                    </td>
                    <td className="text-wholesale-secondary py-3 px-4">
                      {(product.varietal || '-').toUpperCase()}
                    </td>
                    <td className="text-wholesale-secondary py-3 px-4">
                      {product.process.toUpperCase()}
                    </td>
                    <td className="text-wholesale-secondary py-3 px-4">
                      {product.sensory.toUpperCase()}
                    </td>
                    <td className="text-wholesale-secondary text-right py-3 px-4 whitespace-nowrap font-semibold">
                      ${filteredPrices['100G']?.toFixed(2) || '-'}
                    </td>
                    <td className="text-wholesale-secondary text-right py-3 px-4 whitespace-nowrap font-semibold">
                      ${filteredPrices['200G']?.toFixed(2) || '-'}
                    </td>
                    <td className="text-wholesale-secondary text-right py-3 px-4 whitespace-nowrap font-semibold">
                      ${filteredPrices['250G']?.toFixed(2) || '-'}
                    </td>
                    <td className="text-wholesale-secondary text-right py-3 px-4 whitespace-nowrap font-semibold">
                      ${filteredPrices['1KG']?.toFixed(2) || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WholesaleRowTable;
