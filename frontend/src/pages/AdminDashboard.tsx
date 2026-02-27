import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminGetAllProfiles,
  useAdminGetAllMoneyRequests,
  useAdminGetAllTransactions,
  useAdminFulfillMoneyRequest,
  useAdminSendMoneyOnBehalf,
} from '../hooks/useQueries';
import { formatNGN, formatTimestamp, isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  RefreshCw,
  LogOut,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import BankAccountLookup from '../components/BankAccountLookup';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: profilesLoading, error: profilesError, refetch: refetchProfiles } = useAdminGetAllProfiles();
  const { data: moneyRequests, isLoading: requestsLoading, error: requestsError, refetch: refetchRequests } = useAdminGetAllMoneyRequests();
  const { data: transactions, isLoading: txLoading, error: txError, refetch: refetchTx } = useAdminGetAllTransactions();

  const fulfillMutation = useAdminFulfillMoneyRequest();
  const sendMoneyMutation = useAdminSendMoneyOnBehalf();

  // Send money form state
  const [sendBank, setSendBank] = useState('');
  const [sendAccountNumber, setSendAccountNumber] = useState('');
  const [sendAccountName, setSendAccountName] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNarration, setSendNarration] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  const [fulfillError, setFulfillError] = useState('');

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminEmail');
    queryClient.clear();
    navigate({ to: '/admin/login' });
  };

  const handleFulfill = async (requestId: string) => {
    setFulfillError('');
    try {
      await fulfillMutation.mutateAsync(requestId);
    } catch (err) {
      if (isCanisterStoppedError(err)) {
        setFulfillError(SERVICE_UNAVAILABLE_MSG);
      } else {
        setFulfillError((err as Error).message ?? 'Failed to fulfill request.');
      }
    }
  };

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    if (!sendBank || !sendAccountNumber || !sendAccountName || !sendAmount) return;
    try {
      await sendMoneyMutation.mutateAsync({
        recipientBank: sendBank,
        accountNumber: sendAccountNumber,
        accountName: sendAccountName,
        amount: BigInt(Math.round(parseFloat(sendAmount) * 100)),
        narration: sendNarration,
      });
      setSendSuccess(true);
      setSendBank('');
      setSendAccountNumber('');
      setSendAccountName('');
      setSendAmount('');
      setSendNarration('');
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      if (isCanisterStoppedError(err)) {
        setSendError(SERVICE_UNAVAILABLE_MSG);
      } else {
        setSendError((err as Error).message ?? 'Failed to send money.');
      }
    }
  };

  const pendingRequests = moneyRequests?.filter(r => r.status === 'pending') ?? [];
  const fulfilledRequests = moneyRequests?.filter(r => r.status === 'fulfilled') ?? [];

  const formatDate = (ts: bigint | number) => {
    const n = typeof ts === 'bigint' ? Number(ts) : ts;
    if (!n || n === 0) return 'N/A';
    return formatTimestamp(BigInt(n));
  };

  const getErrorMessage = (error: unknown): string => {
    if (!error) return '';
    if (isCanisterStoppedError(error)) return SERVICE_UNAVAILABLE_MSG;
    return (error as Error).message ?? 'An error occurred.';
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/generated/nigeria-pay-logo.dim_256x256.png" alt="NigeriaPay" className="h-8 w-8" />
            <div>
              <h1 className="font-bold text-foreground">NigeriaPay Admin</h1>
              <p className="text-xs text-muted-foreground">Management Portal</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{profiles?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{fulfilledRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Fulfilled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{transactions?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="users">User Submissions</TabsTrigger>
            <TabsTrigger value="requests">Money Requests</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="send">Send Money</TabsTrigger>
          </TabsList>

          {/* ── User Submissions Tab ── */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registered Users — All Data (Plain Text)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchProfiles()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {profilesLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-muted-foreground">Loading users...</span>
                  </div>
                )}

                {profilesError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Unable to load profiles.</p>
                      <p className="text-sm mt-1">{getErrorMessage(profilesError)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => refetchProfiles()}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {!profilesLoading && !profilesError && profiles && profiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No registered users yet.</p>
                  </div>
                )}

                {!profilesLoading && !profilesError && profiles && profiles.length > 0 && (
                  <div className="space-y-4">
                    {profiles.map((profile, idx) => (
                      <div key={profile.principal || idx} className="border border-border rounded-lg p-4 bg-background space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground">#{idx + 1} — {profile.displayName || 'No Name'}</span>
                          <div className="flex gap-2">
                            {profile.phoneVerified && (
                              <Badge variant="default" className="text-xs bg-success text-white">Phone ✓</Badge>
                            )}
                            {profile.emailVerified && (
                              <Badge variant="default" className="text-xs bg-primary text-white">Email ✓</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Principal: </span>
                            <span className="font-mono text-xs break-all">{profile.principal || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Display Name: </span>
                            <span>{profile.displayName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone: </span>
                            <span>{profile.phoneNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone Verified: </span>
                            <span className={profile.phoneVerified ? 'text-success font-medium' : 'text-destructive'}>
                              {profile.phoneVerified ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span>{profile.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email Verified: </span>
                            <span className={profile.emailVerified ? 'text-success font-medium' : 'text-destructive'}>
                              {profile.emailVerified ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Password: </span>
                            <span className="font-mono">{profile.password || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Device Type: </span>
                            <span>{profile.deviceType || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Registration Date: </span>
                            <span>{formatDate(profile.registrationTimestamp)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Login: </span>
                            <span>{formatDate(profile.lastLoginTimestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Money Requests Tab ── */}
          <TabsContent value="requests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Money Requests</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchRequests()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {requestsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-muted-foreground">Loading requests...</span>
                  </div>
                )}
                {requestsError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{getErrorMessage(requestsError)}</AlertDescription>
                  </Alert>
                )}
                {fulfillError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{fulfillError}</AlertDescription>
                  </Alert>
                )}
                {!requestsLoading && !requestsError && (!moneyRequests || moneyRequests.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No money requests yet.</div>
                )}
                {!requestsLoading && !requestsError && moneyRequests && moneyRequests.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requester</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moneyRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-mono text-xs max-w-[120px] truncate">{req.requester.toString()}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{req.reason}</TableCell>
                            <TableCell>{formatNGN(Number(req.amountNeeded))}</TableCell>
                            <TableCell>{req.bank}</TableCell>
                            <TableCell className="font-mono">{req.accountNumber}</TableCell>
                            <TableCell>{req.accountName}</TableCell>
                            <TableCell>{formatDate(req.timestamp)}</TableCell>
                            <TableCell>
                              <Badge variant={req.status === 'fulfilled' ? 'default' : 'secondary'}>
                                {req.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {req.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleFulfill(req.id)}
                                  disabled={fulfillMutation.isPending}
                                >
                                  {fulfillMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Fulfill'
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Transactions Tab ── */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchTx()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {txLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-muted-foreground">Loading transactions...</span>
                  </div>
                )}
                {txError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{getErrorMessage(txError)}</AlertDescription>
                  </Alert>
                )}
                {!txLoading && !txError && (!transactions || transactions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No transactions yet.</div>
                )}
                {!txLoading && !txError && transactions && transactions.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Sender</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Narration</TableHead>
                          <TableHead>Paystack Ref</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions
                          .slice()
                          .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                          .map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="text-xs whitespace-nowrap">{formatDate(tx.timestamp)}</TableCell>
                              <TableCell className="font-mono text-xs max-w-[100px] truncate">{tx.sender.toString()}</TableCell>
                              <TableCell className="text-sm">{tx.recipientAccountName}</TableCell>
                              <TableCell className="text-sm">{tx.recipientBank}</TableCell>
                              <TableCell className="font-mono text-sm">{tx.recipientAccountNumber}</TableCell>
                              <TableCell className="font-semibold text-sm">{formatNGN(Number(tx.amount))}</TableCell>
                              <TableCell className="text-sm max-w-[120px] truncate">{tx.narration || '—'}</TableCell>
                              <TableCell className="font-mono text-xs">{tx.paystackReference || '—'}</TableCell>
                              <TableCell>
                                <Badge variant={tx.status === 'completed' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}>
                                  {String(tx.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Send Money Tab ── */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Send Money on Behalf</CardTitle>
              </CardHeader>
              <CardContent>
                {sendSuccess && (
                  <Alert className="mb-4 border-success/30 bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <AlertDescription className="text-success font-medium">
                      Money sent successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {sendError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{sendError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSendMoney} className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label>Bank Account Lookup</Label>
                    <BankAccountLookup
                      onVerified={(bank, accountNumber, accountName) => {
                        setSendBank(bank);
                        setSendAccountNumber(accountNumber);
                        setSendAccountName(accountName);
                      }}
                    />
                  </div>

                  {sendBank && (
                    <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-medium">{sendBank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-mono">{sendAccountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{sendAccountName}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="sendAmount">Amount (₦)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                      <Input
                        id="sendAmount"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        className="pl-7"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendNarration">Narration (optional)</Label>
                    <Textarea
                      id="sendNarration"
                      placeholder="Payment description…"
                      value={sendNarration}
                      onChange={(e) => setSendNarration(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendMoneyMutation.isPending || !sendBank || !sendAmount}
                    className="w-full"
                  >
                    {sendMoneyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send Money'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
