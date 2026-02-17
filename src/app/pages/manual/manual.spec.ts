import '../../../test-setup';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ManualPage } from './manual';

// Mock marked
vi.mock('marked', () => ({
  marked: {
    parse: vi.fn().mockResolvedValue('<h1>Manual</h1>')
  }
}));

describe('Manual Page', () => {
  let component: ManualPage;
  let httpMock: any;
  let sanitizerMock: any;
  let cdrMock: any;

  beforeEach(() => {
    httpMock = {
      get: vi.fn().mockReturnValue(of('# Manual Content'))
    };

    sanitizerMock = {
      bypassSecurityTrustHtml: vi.fn().mockReturnValue('<h1>Manual</h1>')
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new ManualPage(httpMock, sanitizerMock, cdrMock);
  });

  it('loads manual on init', async () => {
    // Manually trigger ngOnInit which calls loadManual
    component.ngOnInit();
    
    // loadManual is async because marked.parse is async
    // We need to wait for promises
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(httpMock.get).toHaveBeenCalledWith('user-manual.md', { responseType: 'text' });
    expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalled();
    expect(component.loading).toBe(false);
    expect(component.manualHtml).toBeDefined();
  });

  it('handles error loading manual', async () => {
    httpMock.get.mockReturnValue(throwError(() => new Error('404')));

    component.ngOnInit();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(component.error).toBe('Unable to load the manual right now.');
    expect(component.loading).toBe(false);
  });
});
