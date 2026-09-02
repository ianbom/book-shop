<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['store_name', 'whatsapp_number', 'email', 'address'])]
class StoreSetting extends Model
{
    use HasFactory, SoftDeletes;
}
