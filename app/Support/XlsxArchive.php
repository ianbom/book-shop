<?php

namespace App\Support;

use DOMDocument;
use Illuminate\Validation\ValidationException;
use Throwable;
use ZipArchive;

final class XlsxArchive
{
    public static function check(string $path): void
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages(['file' => 'File harus berupa workbook .xlsx yang valid.']);
        }
        try {
            if ($zip->numFiles > 2000 || $zip->locateName('xl/workbook.xml') === false || $zip->locateName('[Content_Types].xml') === false) {
                throw new \RuntimeException;
            }
            $total = 0;
            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);
                if ($stat === false) {
                    throw new \RuntimeException;
                }
                $name = str_replace('\\', '/', $stat['name']);
                $total += $stat['size'];
                if ($total > 100 * 1024 * 1024 || $stat['size'] > 30 * 1024 * 1024
                    || $stat['encryption_method'] !== 0
                    || preg_match('#(^/|(^|/)\.\.(/|$)|^[a-z]:|vbaProject|externalLinks)#i', $name)) {
                    throw new \RuntimeException;
                }
                if (preg_match('/\.(xml|rels)$/i', $name)) {
                    $xml = $zip->getFromIndex($index);
                    if ($xml === false || str_contains($xml, "\0") || preg_match('/<!DOCTYPE|<!ENTITY|macroEnabled/i', $xml)) {
                        throw new \RuntimeException;
                    }
                    if (str_ends_with(strtolower($name), '.rels')) {
                        $document = new DOMDocument;
                        if (! @$document->loadXML($xml, LIBXML_NONET)) {
                            throw new \RuntimeException;
                        }
                        foreach ($document->getElementsByTagNameNS('*', 'Relationship') as $relationship) {
                            if (strcasecmp($relationship->getAttribute('TargetMode'), 'External') === 0
                                && ! in_array($relationship->getAttribute('Type'), [
                                    'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
                                    'http://purl.oclc.org/ooxml/officeDocument/relationships/hyperlink',
                                ], true)) {
                                throw new \RuntimeException;
                            }
                        }
                    }
                }
            }
        } catch (Throwable $exception) {
            throw ValidationException::withMessages(['file' => 'Workbook tidak aman, terenkripsi, atau melebihi batas ekstraksi (100 MB). Gunakan template tanpa macro/referensi workbook eksternal.']);
        } finally {
            $zip->close();
        }
    }
}
