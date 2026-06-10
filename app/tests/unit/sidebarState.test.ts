import { describe, expect, it } from 'vitest';
import { $sidebarCollapsed } from '~/stores/sidebarState';

describe('$sidebarCollapsed', () => {
  it('exposes get and set methods', () => {
    expect(typeof $sidebarCollapsed.get).toBe('function');
    expect(typeof $sidebarCollapsed.set).toBe('function');
  });

  it('stores boolean values', () => {
    $sidebarCollapsed.set(true);
    expect($sidebarCollapsed.get()).toBe(true);
    $sidebarCollapsed.set(false);
    expect($sidebarCollapsed.get()).toBe(false);
  });
});
