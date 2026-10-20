<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PreOrderCodes\SavePreOrderCodeRequest;
use App\Http\Resources\Admin\PreOrderCodeResource;
use App\Models\PreOrderCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Inertia\Inertia;
use Inertia\Response;

class PreOrderCodeController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100']]);
        $search = $filters['search'] ?? '';
        $codes = PreOrderCode::query()->withCount('books')
            ->when($search !== '', fn ($query) => $query->where('code', 'like', "%{$search}%"))
            ->orderBy('code')->paginate(20)->withQueryString();

        return Inertia::render('admin/pre-order-codes/index', [
            'preOrderCodes' => PreOrderCodeResource::collection($codes),
            'filters' => $filters,
        ]);
    }

    public function store(SavePreOrderCodeRequest $request): RedirectResponse
    {
        PreOrderCode::create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kode preorder berhasil dibuat.']);

        return back();
    }

    public function update(SavePreOrderCodeRequest $request, PreOrderCode $preOrderCode): RedirectResponse
    {
        $preOrderCode->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kode preorder berhasil diperbarui.']);

        return back();
    }

    public function destroy(PreOrderCode $preOrderCode): RedirectResponse
    {
        $preOrderCode->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kode preorder berhasil dihapus. Relasi buku lama tetap disimpan.']);

        return back();
    }

    public function books(PreOrderCode $preOrderCode): AnonymousResourceCollection
    {
        return JsonResource::collection($preOrderCode->books()->select('id', 'title', 'author', 'stock', 'is_active')
            ->orderBy('title')->orderBy('id')->paginate(10));
    }
}
