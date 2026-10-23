<?php

namespace App\Models;

use App\Support\BookReferenceName;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['code'])]
class PreOrderCode extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::saving(function (PreOrderCode $code): void {
            $code->code = BookReferenceName::display($code->code);
            $code->setAttribute('normalized_key', BookReferenceName::key($code->code));
        });
    }

    /** @return HasMany<Book, $this> */
    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}
