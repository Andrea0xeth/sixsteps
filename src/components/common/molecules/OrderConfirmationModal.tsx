import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Box,
  Grid,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Stack,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputLabel,
  FormGroup,
  Checkbox,
  Chip,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import { 
  Close as CloseIcon, 
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { exportOrderSummary, OrderExportProduct } from '../../../utils/exportUtils';

export interface PriceBreakdown {
  quantity: number;
  unitPrice: number;
  supplier: string;
  stock: number;
}

export interface ProductItem {
  id: string;
  name: string;
  code: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  priceBreakdowns?: PriceBreakdown[];
  averagePrice?: number;
  publicPrice?: number;
  vat?: number;
}

export interface OrderData {
  orderName: string;
  expectedDeliveryDate: string;
  notes: string;
  priority: 'standard' | 'urgent' | 'scheduled';
  paymentMethod: string;
  saveAsTemplate: boolean;
  notifyOnDelivery: boolean;
}

interface OrderConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onSaveAsDraft: () => void;
  onSubmitOrder: (orderData: OrderData) => void;
  products: ProductItem[];
  totalAmount: number;
  userRole?: string;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  open,
  onClose,
  onSaveAsDraft,
  onSubmitOrder,
  products,
  totalAmount,
  userRole = 'Buyer'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isAdmin = userRole === 'Admin';

  const [orderData, setOrderData] = useState<OrderData>({
    orderName: '',
    expectedDeliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
    priority: 'urgent',
    paymentMethod: 'Invoice 30 days',
    saveAsTemplate: false,
    notifyOnDelivery: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setOrderData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderData(prev => ({ 
      ...prev, 
      priority: e.target.value as 'standard' | 'urgent' | 'scheduled' 
    }));
  };

  // Count unique suppliers
  const uniqueSuppliers = new Set(products.map(product => product.supplier)).size;
  
  // Calculate total quantity
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

  // Calculate additional statistics
  const totalSavingsVsAverage = products.reduce((sum, product) => {
    if (product.averagePrice) {
      return sum + ((product.averagePrice - product.unitPrice) * product.quantity);
    }
    return sum;
  }, 0);

  const averageDiscountPercent = products.reduce((sum, product) => {
    if (product.publicPrice) {
      const discount = ((product.publicPrice - product.unitPrice) / product.publicPrice) * 100;
      return sum + discount;
    }
    return sum;
  }, 0) / products.filter(p => p.publicPrice).length;

  // Handle export
  const handleExport = (format: 'csv' | 'xlsx') => {
    const orderName = orderData.orderName || 'Untitled Order';
    
    const exportProducts: OrderExportProduct[] = products.map(product => ({
      id: product.id,
      name: product.name,
      code: product.code,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      averagePrice: product.averagePrice,
      priceBreakdowns: product.priceBreakdowns,
      publicPrice: product.publicPrice,
      vat: product.vat
    }));

    exportOrderSummary(orderName, exportProducts, format, userRole);
  };

  const ProductRow = ({ product }: { product: ProductItem }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Total price calculation
    const totalPrice = product.quantity * product.unitPrice;
    
    // Calculate savings and discounts
    const savingsVsAverage = product.averagePrice ? 
      (product.averagePrice - product.unitPrice) * product.quantity : 0;
    
    const grossDiscount = product.publicPrice ? 
      product.publicPrice - product.unitPrice : 0;
    const grossDiscountPercent = product.publicPrice ? 
      ((grossDiscount / product.publicPrice) * 100) : 0;

    const netPublicPrice = product.publicPrice && product.vat ? 
      product.publicPrice / (1 + product.vat / 100) : 0;
    const netDiscount = netPublicPrice ? netPublicPrice - product.unitPrice : 0;
    const netDiscountPercent = netPublicPrice ? 
      ((netDiscount / netPublicPrice) * 100) : 0;
    
    return (
      <>
        <TableRow 
          sx={{ 
            cursor: expanded ? 'default' : 'pointer',
            '&:hover': expanded ? {} : { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
          }}
          onClick={() => !expanded && setExpanded(true)}
        >
          <TableCell>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="medium">{product.name}</Typography>
              <Typography variant="caption" color="text.secondary">{product.code}</Typography>
              {/* Technical information preview */}
              {product.publicPrice && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={`${grossDiscountPercent.toFixed(1)}% discount`} 
                    size="small" 
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                  {product.vat && (
                    <Chip 
                      label={`VAT ${product.vat}%`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: '16px', ml: 0.5 }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </TableCell>
          <TableCell align="center">{product.quantity}</TableCell>
          <TableCell align="right">
            <Box>
              <Typography variant="body2" fontWeight="medium">€{product.unitPrice.toFixed(2)}</Typography>
              {product.averagePrice && product.averagePrice !== product.unitPrice && (
                <Typography variant="caption" color="text.secondary">
                  Avg: €{product.averagePrice.toFixed(2)}
                </Typography>
              )}
            </Box>
          </TableCell>
          <TableCell align="right">
            <Box>
              <Typography variant="body2" fontWeight="medium">€{totalPrice.toFixed(2)}</Typography>
              {savingsVsAverage > 0 && (
                <Typography variant="caption" color="success.main">
                  Save: €{savingsVsAverage.toFixed(2)}
                </Typography>
              )}
            </Box>
          </TableCell>
          <TableCell padding="checkbox" sx={{ width: 40 }}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ p: 0.5 }}
            >
              {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          </TableCell>
        </TableRow>
        
        {expanded && (
          <TableRow sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
            '& > td': { py: 0, borderBottom: 0 }
          }}>
            <TableCell colSpan={5}>
              <Box sx={{ p: 1.5 }}>
                {/* Technical Details Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                    📊 Technical Details
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mb: 1.5 }}>
                    {product.publicPrice && (
                      <>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Public Price (VAT incl.):</Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium' }}>
                            €{product.publicPrice.toFixed(2)}
                          </Typography>
                        </Grid>
                        {product.vat && (
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="text.secondary">Public Price (VAT excl.):</Typography>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium' }}>
                              €{netPublicPrice.toFixed(2)}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                    
                    {grossDiscount > 0 && (
                      <>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Gross Discount:</Typography>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium', color: 'success.main' }}>
                            €{grossDiscount.toFixed(2)} ({grossDiscountPercent.toFixed(1)}%)
                          </Typography>
                        </Grid>
                        {netDiscount > 0 && (
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="text.secondary">Net Discount:</Typography>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium', color: 'warning.main' }}>
                              €{netDiscount.toFixed(2)} ({netDiscountPercent.toFixed(1)}%)
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                    
                    {product.averagePrice && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Savings vs Average:</Typography>
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          fontWeight: 'medium',
                          color: savingsVsAverage > 0 ? 'success.main' : 'error.main'
                        }}>
                          €{savingsVsAverage.toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  💰 Price Tiers (optimized distribution)
                </Typography>
                
                <Table size="small" sx={{ mb: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>Available</TableCell>
                      {isAdmin && <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1 }}>Supplier</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.priceBreakdowns?.map((breakdown, idx) => (
                      <TableRow key={idx} sx={{ 
                        '& td': { py: 0.75, fontSize: '0.75rem' },
                        backgroundColor: idx % 2 ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
                      }}>
                        <TableCell>{breakdown.quantity}</TableCell>
                        <TableCell align="right" sx={{ 
                          fontWeight: 'medium',
                          color: idx === 0 ? 'success.main' : 'inherit'
                        }}>
                          €{breakdown.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">{breakdown.stock}</TableCell>
                        {isAdmin && (
                          <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                            {breakdown.supplier}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {product.averagePrice && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderTop: `1px dashed ${theme.palette.divider}`,
                    pt: 0.5
                  }}>
                    <Typography variant="caption" fontWeight="medium">Average Purchase Price:</Typography>
                    <Typography variant="caption" fontWeight="bold">€{product.averagePrice.toFixed(2)}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(false);
                    }}
                    sx={{ 
                      fontSize: '0.75rem', 
                      textTransform: 'none',
                      minWidth: 0,
                      p: 0.5,
                      color: 'text.secondary'
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        zIndex: 10000,
        '& .MuiDialog-paper': {
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: { xs: 0, sm: 1 },
          m: { xs: 0, sm: 2 },
          boxShadow: { xs: 'none', sm: theme.shadows[10] },
          ...(isMobile && {
            position: 'fixed',
            bottom: 0,
            maxHeight: '90vh',
          })
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>Order Summary</Typography>
        <IconButton 
          edge="end" 
          onClick={onClose} 
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 1, sm: 2 }, pt: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 3, mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Order Name"
                name="orderName"
                fullWidth
                value={orderData.orderName}
                onChange={handleChange}
                placeholder="Enter a name for this order"
                variant="outlined"
                size="small"
                required
                sx={{ mb: 1.5 }}
              />
              
              <Box sx={{ mt: 1.5 }}>
                <TextField
                  label="Expected Delivery"
                  name="expectedDeliveryDate"
                  type="date"
                  fullWidth
                  value={orderData.expectedDeliveryDate}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.01)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">Products</Typography>
                  <Typography variant="body2">{products.length}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">Total Quantity</Typography>
                  <Typography variant="body2">{totalQuantity} units</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">Suppliers</Typography>
                  <Typography variant="body2">{uniqueSuppliers}</Typography>
                </Box>

                {/* Technical Information */}
                {totalSavingsVsAverage > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Savings vs Avg</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      €{totalSavingsVsAverage.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {!isNaN(averageDiscountPercent) && averageDiscountPercent > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Avg Discount</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      {averageDiscountPercent.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 1.5 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Total</Typography>
                  <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                    €{totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            mb: 3, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflow: 'auto'
          }}
        >
          <Table 
            size="small"
            sx={{
              minWidth: '1000px'
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell sx={{ fontWeight: 'medium' }}>Product</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'medium' }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>Total</TableCell>
                <TableCell padding="checkbox" sx={{ width: 40 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
              <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'medium', py: 1.5 }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 1.5 }}>
                  €{totalAmount.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box 
          sx={{ 
            p: 1.5, 
            mb: 2.5,
            bgcolor: 'rgba(0, 0, 0, 0.01)', 
            borderRadius: 1, 
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Order Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl component="fieldset" size="small" sx={{ mb: 1.5, width: '100%' }}>
                <FormLabel component="legend" sx={{ fontSize: '0.8125rem' }}>
                  Priority
                </FormLabel>
                <RadioGroup 
                  row 
                  name="priority"
                  value={orderData.priority}
                  onChange={handleRadioChange}
                >
                  <FormControlLabel 
                    value="standard" 
                    control={<Radio size="small" />} 
                    label={<Typography variant="body2">Standard</Typography>} 
                  />
                  <FormControlLabel 
                    value="urgent" 
                    control={<Radio size="small" />} 
                    label={<Typography variant="body2">Urgent</Typography>} 
                  />
                  <FormControlLabel 
                    value="scheduled" 
                    control={<Radio size="small" />} 
                    label={<Typography variant="body2">Scheduled</Typography>} 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  id="payment-method"
                  name="paymentMethod"
                  value={orderData.paymentMethod}
                  label="Payment Method"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="Invoice 30 days">Invoice 30 days</MenuItem>
                  <MenuItem value="Invoice 60 days">Invoice 60 days</MenuItem>
                  <MenuItem value="Credit Card">Credit Card</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes"
                name="notes"
                multiline
                rows={2}
                fullWidth
                value={orderData.notes}
                onChange={handleChange}
                placeholder="Add any special instructions or notes"
                variant="outlined"
                size="small"
                sx={{ mb: 1.5 }}
              />
              
              <FormGroup row sx={{ mt: 1 }}>
                <FormControlLabel 
                  control={
                    <Checkbox 
                      name="saveAsTemplate" 
                      checked={orderData.saveAsTemplate} 
                      onChange={handleCheckboxChange} 
                      size="small" 
                    />
                  } 
                  label="Save as template" 
                />
                <FormControlLabel 
                  control={
                    <Checkbox 
                      name="notifyOnDelivery" 
                      checked={orderData.notifyOnDelivery} 
                      onChange={handleCheckboxChange} 
                      size="small" 
                    />
                  } 
                  label="Notify on delivery" 
                />
              </FormGroup>
            </Grid>
          </Grid>
        </Box>

        <Stack 
          direction="row"
          spacing={1.5} 
          justifyContent="flex-end"
        >
          {/* Export Button with Dropdown */}
          <Stack direction="row" spacing={0.5}>
            <Button 
              variant="outlined"
              onClick={() => handleExport('xlsx')}
              startIcon={<DownloadIcon />}
              size="medium"
              sx={{ 
                borderRadius: '4px 0 0 4px',
                textTransform: 'none',
                minWidth: '100px',
                borderRight: 'none'
              }}
            >
              Export Excel
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => handleExport('csv')}
              size="medium"
              sx={{ 
                borderRadius: '0 4px 4px 0',
                textTransform: 'none',
                minWidth: '80px',
                borderLeft: 'none'
              }}
            >
              CSV
            </Button>
          </Stack>

          <Button 
            variant="outlined" 
            onClick={() => {
              onSaveAsDraft();
              onClose();
            }}
            startIcon={<SaveIcon />}
            size="medium"
            sx={{ 
              borderRadius: '4px',
              textTransform: 'none',
              minWidth: '110px'
            }}
          >
            Save Draft
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              onSubmitOrder(orderData);
              onClose();
            }}
            disabled={!orderData.orderName.trim()}
            startIcon={<SendIcon />}
            size="medium"
            sx={{ 
              borderRadius: '4px',
              textTransform: 'none',
              minWidth: '110px'
            }}
          >
            Submit Order
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationModal; 