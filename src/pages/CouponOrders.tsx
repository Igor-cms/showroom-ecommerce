import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCouponOrders, CouponOrder } from "@/hooks/useCouponOrders";
import { Loader2, Eye, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CouponOrders = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { data: orders, isLoading, error } = useCouponOrders(undefined, { startDate, endDate });
  const [selectedOrder, setSelectedOrder] = useState<CouponOrder | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Orders</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to fetch coupon orders'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalCommission = orders?.reduce((sum, order) => sum + (order.subtotal_price * 0.10), 0) ?? 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">Orders with Discount Coupons</CardTitle>
                <CardDescription>
                  All orders from your Shopify store that used discount codes
                </CardDescription>
              </div>
              {orders && orders.length > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4">
                    <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Total Commission</div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      USD ${totalCommission.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      From {orders.length} order{orders.length !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
              <span className="text-sm font-medium text-muted-foreground">Filter by date:</span>
              
              {/* From Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* To Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Clear Button */}
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {!orders || orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No orders with discount codes found</p>
                <p className="text-sm mt-2">Orders that use discount coupons will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-center">Date</TableHead>
                      <TableHead className="w-[80px] text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">
                            {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.currency} ${order.subtotal_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          -{order.currency} ${order.total_discount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {order.currency} ${(order.subtotal_price * 0.10).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            {format(new Date(order.order_date), 'MM/dd/yy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            order.financial_status === 'paid' 
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : order.financial_status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {order.financial_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="flex flex-wrap gap-3 mt-2">
                  <span>Customer: <strong>{selectedOrder.customer_name}</strong></span>
                  <span>•</span>
                  <span>Coupon: <strong className="text-primary">{selectedOrder.discount_codes}</strong></span>
                  <span>•</span>
                  <span>Date: <strong>{format(new Date(selectedOrder.order_date), 'MMM dd, yyyy')}</strong></span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.line_items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>
                        {item.variant_title && item.variant_title !== 'Default Title' 
                          ? item.variant_title 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {selectedOrder.currency} ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {selectedOrder.currency} ${item.total_price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Summary */}
              {(() => {
                const itemsSubtotal = selectedOrder.line_items.reduce(
                  (sum, item) => sum + item.total_price, 0
                );
                return (
                  <div className="mt-6 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (items)</span>
                      <span>{selectedOrder.currency} ${itemsSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({selectedOrder.discount_codes})</span>
                      <span>-{selectedOrder.currency} ${selectedOrder.total_discount.toFixed(2)}</span>
                    </div>
                    {selectedOrder.shipping_total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>+{selectedOrder.currency} ${selectedOrder.shipping_total.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.tax_total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxes</span>
                        <span>+{selectedOrder.currency} ${selectedOrder.tax_total.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>{selectedOrder.currency} ${selectedOrder.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponOrders;
