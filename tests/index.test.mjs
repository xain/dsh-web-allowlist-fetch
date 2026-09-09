import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileEntry,
  cidrContains,
  isNonPublicAddress,
  ipFamily,
} from '../lib/index.mjs';

test('ipFamily classifies IPv4 / IPv6 / non-IP', () => {
  assert.equal(ipFamily('192.168.1.1'), 4);
  assert.equal(ipFamily('8.8.8.8'), 4);
  assert.equal(ipFamily('2001:db8::1'), 6);
  assert.equal(ipFamily('::1'), 6);
  assert.equal(ipFamily('example.com'), 0);
});

test('cidrContains matches IPv4 CIDR', () => {
  assert.equal(cidrContains('198.18.0.0', 15, '198.18.51.91'), true);
  assert.equal(cidrContains('198.18.0.0', 15, '198.19.255.255'), true);
  assert.equal(cidrContains('198.18.0.0', 15, '198.20.0.1'), false);
  assert.equal(cidrContains('10.0.0.0', 8, '10.1.2.3'), true);
  assert.equal(cidrContains('10.0.0.0', 8, '11.1.2.3'), false);
});

test('isNonPublicAddress flags special-use ranges', () => {
  for (const ip of ['127.0.0.1', '10.0.0.5', '192.168.1.1', '198.18.51.91', '172.16.0.1']) {
    assert.equal(isNonPublicAddress(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '1.1.1.1', '114.114.114.114']) {
    assert.equal(isNonPublicAddress(ip), false, ip);
  }
});

test('compileEntry domain matches apex and subdomains', () => {
  const m = compileEntry('weather.com');
  assert.equal(m.matches('weather.com', []), true);
  assert.equal(m.matches('www.weather.com', []), true);
  assert.equal(m.matches('a.b.weather.com', []), true);
  assert.equal(m.matches('weather.com.evil.net', []), false);
  assert.equal(m.matches('notweather.com', []), false);
});

test('compileEntry wildcard forms', () => {
  const dotted = compileEntry('.example.com');
  assert.equal(dotted.matches('example.com', []), true);
  assert.equal(dotted.matches('sub.example.com', []), true);
  const wild = compileEntry('*.example.com');
  assert.equal(wild.matches('example.com', []), false);
  assert.equal(wild.matches('sub.example.com', []), true);
});

test('compileEntry IP literal matches on resolved addresses', () => {
  const m = compileEntry('127.0.0.1');
  assert.equal(m.matches('localhost', ['127.0.0.1']), true);
  assert.equal(m.matches('localhost', ['127.0.0.2']), false);
});

test('compileEntry CIDR matches on resolved addresses', () => {
  const m = compileEntry('198.18.0.0/15');
  assert.equal(m.matches('weather.com', ['198.18.51.91']), true);
  assert.equal(m.matches('weather.com', ['8.8.8.8']), false);
});