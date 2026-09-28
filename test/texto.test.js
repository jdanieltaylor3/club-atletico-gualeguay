import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, slugify, formatFecha } from "../lib/texto.js";

test("escapeHtml: escapa caracteres HTML", () => {
  assert.equal(escapeHtml('<b class="x">A & B</b>'), "&lt;b class=&quot;x&quot;&gt;A &amp; B&lt;/b&gt;");
  assert.equal(escapeHtml("'comillas'"), "&#39;comillas&#39;");
  assert.equal(escapeHtml(42), "42");
});

test("slugify: normaliza tildes, mayúsculas, signos y espacios", () => {
  assert.equal(slugify("Club Atlético Gualeguay 26/27"), "club-atletico-gualeguay-26-27");
  assert.equal(slugify("  Nota de Prensa!  "), "nota-de-prensa");
  assert.equal(slugify("Río Uruguay"), "rio-uruguay");
  assert.equal(slugify("---"), "");
});

test("formatFecha: ISO a formato español", () => {
  assert.equal(formatFecha("2026-10-03"), "3 de octubre de 2026");
  assert.equal(formatFecha("2026-01-01"), "1 de enero de 2026");
  assert.equal(formatFecha("2026-12-31"), "31 de diciembre de 2026");
});
