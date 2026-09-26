<?php

namespace App\Enums;

enum WalletTransactionType: string
{
    case TopupCredit = 'topup_credit';
    case OrderPayment = 'order_payment';
    case OrderRefund = 'order_refund';
    case AdminAdjustmentCredit = 'admin_adjustment_credit';
    case AdminAdjustmentDebit = 'admin_adjustment_debit';
}
