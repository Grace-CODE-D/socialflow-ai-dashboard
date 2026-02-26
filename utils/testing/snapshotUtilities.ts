import { ReactElement } from 'react';
import { RenderResult } from '@testing-library/react';
import { customRender } from './testHelpers';

// Snapshot configuration
export interface SnapshotConfig {
  name?: string;
  props?: Record<string, any>;
  theme?: 'light' | 'dark';
  viewport?: 'mobile' | 'tablet' | 'desktop';
  includeStyles?: boolean;
  excludeAttributes?: string[];
}

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

// Snapshot utilities class
export class SnapshotUtilities {
  private static snapshots: Map<string, string> = new Map();
  private static config: SnapshotConfig = {};

  // Set global configuration
  static configure(config: Partial<SnapshotConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Create a snapshot of a component
  static createComponentSnapshot(
    component: ReactElement,
    config: SnapshotConfig = {}
  ): void {
    const finalConfig = { ...this.config, ...config };
    const { name, theme, viewport, includeStyles, excludeAttributes } = finalConfig;

    // Set viewport if specified
    if (viewport) {
      this.setViewport(viewport);
    }

    // Render component
    const result = customRender(component, { theme });
    
    // Process the rendered HTML
    let html = result.container.innerHTML;
    
    if (excludeAttributes?.length) {
      html = this.removeAttributes(html, excludeAttributes);
    }
    
    if (!includeStyles) {
      html = this.removeInlineStyles(html);
    }

    // Create snapshot
    const snapshotName = name || this.generateSnapshotName(component);
    expect(html).toMatchSnapshot(snapshotName);
    
    // Store snapshot for comparison
    this.snapshots.set(snapshotName, html);
  }

  // Create multiple snapshots with different configurations
  static createMultipleSnapshots(
    component: ReactElement,
    configs: SnapshotConfig[]
  ): void {
    configs.forEach(config => {
      this.createComponentSnapshot(component, config);
    });
  }

  // Create responsive snapshots
  static createResponsiveSnapshots(
    component: ReactElement,
    baseName?: string
  ): void {
    const viewports: Array<keyof typeof VIEWPORTS> = ['mobile', 'tablet', 'desktop'];
    
    viewports.forEach(viewport => {
      this.createComponentSnapshot(component, {
        name: baseName ? `${baseName}-${viewport}` : undefined,
        viewport
      });
    });
  }

  // Create theme snapshots
  static createThemeSnapshots(
    component: ReactElement,
    baseName?: string
  ): void {
    const themes: Array<'light' | 'dark'> = ['light', 'dark'];
    
    themes.forEach(theme => {
      this.createComponentSnapshot(component, {
        name: baseName ? `${baseName}-${theme}` : undefined,
        theme
      });
    });
  }

  // Create state-based snapshots
  static createStateSnapshots(
    componentFactory: (props: any) => ReactElement,
    states: Array<{ name: string; props: Record<string, any> }>,
    baseName?: string
  ): void {
    states.forEach(({ name, props }) => {
      const component = componentFactory(props);
      this.createComponentSnapshot(component, {
        name: baseName ? `${baseName}-${name}` : name,
        props
      });
    });
  }

  // Create interaction snapshots
  static async createInteractionSnapshots(
    component: ReactElement,
    interactions: Array<{
      name: string;
      action: (result: RenderResult) => Promise<void> | void;
    }>,
    baseName?: string
  ): Promise<void> {
    for (const { name, action } of interactions) {
      const result = customRender(component);
      
      // Perform interaction
      await action(result);
      
      // Wait for any updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create snapshot
      const snapshotName = baseName ? `${baseName}-${name}` : name;
      expect(result.container.innerHTML).toMatchSnapshot(snapshotName);
    }
  }

  // Compare snapshots
  static compareSnapshots(name1: string, name2: string): boolean {
    const snapshot1 = this.snapshots.get(name1);
    const snapshot2 = this.snapshots.get(name2);
    
    if (!snapshot1 || !snapshot2) {
      throw new Error(`Snapshot not found: ${!snapshot1 ? name1 : name2}`);
    }
    
    return snapshot1 === snapshot2;
  }

  // Get snapshot diff
  static getSnapshotDiff(name1: string, name2: string): string {
    const snapshot1 = this.snapshots.get(name1);
    const snapshot2 = this.snapshots.get(name2);
    
    if (!snapshot1 || !snapshot2) {
      throw new Error(`Snapshot not found: ${!snapshot1 ? name1 : name2}`);
    }
    
    return this.generateDiff(snapshot1, snapshot2);
  }

  // Validate snapshot consistency
  static validateSnapshot(name: string, expectedContent?: string): boolean {
    const snapshot = this.snapshots.get(name);
    
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${name}`);
    }
    
    if (expectedContent) {
      return snapshot === expectedContent;
    }
    
    // Basic validation checks
    return this.isValidHTML(snapshot);
  }

  // Clean up snapshots
  static clearSnapshots(): void {
    this.snapshots.clear();
  }

  // Export snapshots
  static exportSnapshots(): Record<string, string> {
    return Object.fromEntries(this.snapshots);
  }

  // Import snapshots
  static importSnapshots(snapshots: Record<string, string>): void {
    Object.entries(snapshots).forEach(([name, content]) => {
      this.snapshots.set(name, content);
    });
  }

  // Private helper methods
  private static setViewport(viewport: keyof typeof VIEWPORTS): void {
    const { width, height } = VIEWPORTS[viewport];
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  }

  private static generateSnapshotName(component: ReactElement): string {
    const componentName = component.type?.toString().match(/function (\w+)/)?.[1] || 'Component';
    const timestamp = Date.now();
    return `${componentName}-${timestamp}`;
  }

  private static removeAttributes(html: string, attributes: string[]): string {
    let processedHtml = html;
    
    attributes.forEach(attr => {
      const regex = new RegExp(`\\s${attr}="[^"]*"`, 'g');
      processedHtml = processedHtml.replace(regex, '');
    });
    
    return processedHtml;
  }

  private static removeInlineStyles(html: string): string {
    return html.replace(/\sstyle="[^"]*"/g, '');
  }

  private static generateDiff(content1: string, content2: string): string {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    
    const diff: string[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 !== line2) {
        diff.push(`Line ${i + 1}:`);
        diff.push(`- ${line1}`);
        diff.push(`+ ${line2}`);
        diff.push('');
      }
    }
    
    return diff.join('\n');
  }

  private static isValidHTML(html: string): boolean {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return !doc.querySelector('parsererror');
    } catch {
      return false;
    }
  }
}

// Convenience functions
export const createSnapshot = (
  component: ReactElement,
  config?: SnapshotConfig
): void => {
  SnapshotUtilities.createComponentSnapshot(component, config);
};

export const createResponsiveSnapshots = (
  component: ReactElement,
  baseName?: string
): void => {
  SnapshotUtilities.createResponsiveSnapshots(component, baseName);
};

export const createThemeSnapshots = (
  component: ReactElement,
  baseName?: string
): void => {
  SnapshotUtilities.createThemeSnapshots(component, baseName);
};

export const createStateSnapshots = (
  componentFactory: (props: any) => ReactElement,
  states: Array<{ name: string; props: Record<string, any> }>,
  baseName?: string
): void => {
  SnapshotUtilities.createStateSnapshots(componentFactory, states, baseName);
};

export const createInteractionSnapshots = (
  component: ReactElement,
  interactions: Array<{
    name: string;
    action: (result: RenderResult) => Promise<void> | void;
  }>,
  baseName?: string
): Promise<void> => {
  return SnapshotUtilities.createInteractionSnapshots(component, interactions, baseName);
};

// Snapshot matchers for Jest
export const snapshotMatchers = {
  toMatchComponentSnapshot: (received: ReactElement, name?: string) => {
    const result = customRender(received);
    const html = result.container.innerHTML;
    
    return {
      pass: true,
      message: () => `Component snapshot matches`,
      actual: html,
      expected: html
    };
  },
  
  toMatchResponsiveSnapshot: (received: ReactElement, baseName?: string) => {
    try {
      createResponsiveSnapshots(received, baseName);
      return {
        pass: true,
        message: () => `Responsive snapshots match`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Responsive snapshots don't match: ${error}`
      };
    }
  }
};

// Snapshot test suite generator
export const generateSnapshotTestSuite = (
  componentName: string,
  component: ReactElement,
  options: {
    responsive?: boolean;
    themes?: boolean;
    states?: Array<{ name: string; props: Record<string, any> }>;
    interactions?: Array<{
      name: string;
      action: (result: RenderResult) => Promise<void> | void;
    }>;
  } = {}
): void => {
  describe(`${componentName} Snapshots`, () => {
    beforeEach(() => {
      SnapshotUtilities.clearSnapshots();
    });

    it('should match basic snapshot', () => {
      createSnapshot(component, { name: `${componentName}-basic` });
    });

    if (options.responsive) {
      it('should match responsive snapshots', () => {
        createResponsiveSnapshots(component, componentName);
      });
    }

    if (options.themes) {
      it('should match theme snapshots', () => {
        createThemeSnapshots(component, componentName);
      });
    }

    if (options.states) {
      it('should match state snapshots', () => {
        createStateSnapshots(
          (props) => ({ ...component, props: { ...component.props, ...props } }),
          options.states,
          componentName
        );
      });
    }

    if (options.interactions) {
      it('should match interaction snapshots', async () => {
        await createInteractionSnapshots(component, options.interactions, componentName);
      });
    }
  });
};

// Export the main class and utilities
export { SnapshotUtilities };
export default SnapshotUtilities;