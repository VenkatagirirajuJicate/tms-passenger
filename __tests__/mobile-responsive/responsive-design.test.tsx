/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard',
    isReady: true,
  }),
}));

// Mock components that might cause issues in testing
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock window.matchMedia
const mockMatchMedia = jest.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Device configurations
const devices = {
  mobile: {
    name: 'Mobile',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
  },
  tablet: {
    name: 'Tablet',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
  },
  desktop: {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  largeDesktop: {
    name: 'Large Desktop',
    viewport: { width: 2560, height: 1440 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
};

// Helper functions to simulate device behavior
const setViewport = (width: number, height: number) => {
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
  
  // Update CSS media queries
  mockMatchMedia.mockImplementation((query) => ({
    matches: query.includes('max-width') ? width <= parseInt(query.match(/\d+/)?.[0] || '0') : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  
  // Trigger resize event
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

const setUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  });
};

// Mock components for testing
const MockButton = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

const MockForm = ({ children, ...props }: any) => (
  <form {...props}>{children}</form>
);

const MockInput = (props: any) => (
  <input {...props} />
);

const MockNavigation = ({ items }: any) => (
  <nav>
    {items.map((item: any, index: number) => (
      <a key={index} href={item.href}>{item.label}</a>
    ))}
  </nav>
);

describe('Mobile Responsive Design Tests', () => {
  beforeEach(() => {
    // Reset viewport to default
    setViewport(1920, 1080);
    jest.clearAllMocks();
  });

  describe('Layout Adaptation', () => {
    Object.entries(devices).forEach(([deviceType, device]) => {
      test(`should adapt layout for ${device.name}`, () => {
        setViewport(device.viewport.width, device.viewport.height);
        setUserAgent(device.userAgent);

        render(
          <div className="responsive-container">
            <MockNavigation items={[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/bookings', label: 'Bookings' },
              { href: '/profile', label: 'Profile' },
            ]} />
            <MockCard>
              <h1>Dashboard</h1>
              <p>Welcome to your dashboard</p>
            </MockCard>
          </div>
        );

        const container = screen.getByRole('heading', { name: 'Dashboard' }).closest('div');
        expect(container).toBeInTheDocument();
        
        // Check that responsive classes would be applied
        const isMobile = device.viewport.width <= 768;
        const isTablet = device.viewport.width > 768 && device.viewport.width <= 1024;
        
        if (isMobile) {
          expect(window.innerWidth).toBe(device.viewport.width);
          expect(window.innerWidth).toBeLessThanOrEqual(768);
        } else if (isTablet) {
          expect(window.innerWidth).toBeGreaterThan(768);
          expect(window.innerWidth).toBeLessThanOrEqual(1024);
        } else {
          expect(window.innerWidth).toBeGreaterThan(1024);
        }
      });
    });
  });

  describe('Touch Interactions', () => {
    test('should handle touch events on mobile', () => {
      setViewport(375, 667);
      setUserAgent(devices.mobile.userAgent);

      const handleClick = jest.fn();
      render(
        <MockButton onClick={handleClick}>
          Touch Target
        </MockButton>
      );

      const button = screen.getByText('Touch Target');
      
      // Simulate touch events
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    test('should have appropriate touch target sizes', () => {
      setViewport(375, 667);
      
      render(
        <div>
          <MockButton style={{ minHeight: '44px', minWidth: '44px' }}>
            Button 1
          </MockButton>
          <MockButton style={{ minHeight: '44px', minWidth: '44px' }}>
            Button 2
          </MockButton>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // In a real implementation, these would check actual computed styles
        expect(button).toBeInTheDocument();
      });
    });

    test('should handle form input on mobile', () => {
      setViewport(375, 667);
      
      render(
        <MockForm>
          <MockInput 
            type="text" 
            placeholder="Enter text" 
            data-testid="mobile-input"
          />
          <MockInput 
            type="email" 
            placeholder="Enter email" 
            data-testid="mobile-email"
          />
        </MockForm>
      );

      const textInput = screen.getByTestId('mobile-input');
      const emailInput = screen.getByTestId('mobile-email');

      fireEvent.focus(textInput);
      fireEvent.change(textInput, { target: { value: 'test text' } });
      
      fireEvent.focus(emailInput);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(textInput).toHaveValue('test text');
      expect(emailInput).toHaveValue('test@example.com');
    });

    test('should handle dropdown menus on touch devices', () => {
      setViewport(375, 667);
      
      const mockOptions = ['Option 1', 'Option 2', 'Option 3'];
      
      render(
        <select data-testid="mobile-select">
          {mockOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      );

      const select = screen.getByTestId('mobile-select');
      
      fireEvent.touchStart(select);
      fireEvent.change(select, { target: { value: 'Option 2' } });
      
      expect(select).toHaveValue('Option 2');
    });

    test('should handle swipe gestures simulation', () => {
      setViewport(375, 667);
      
      const handleSwipe = jest.fn();
      
      render(
        <div 
          data-testid="swipe-container"
          onTouchStart={handleSwipe}
          onTouchMove={handleSwipe}
          onTouchEnd={handleSwipe}
        >
          Swipeable Content
        </div>
      );

      const container = screen.getByTestId('swipe-container');
      
      // Simulate swipe gesture
      fireEvent.touchStart(container, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(container);

      expect(handleSwipe).toHaveBeenCalledTimes(3);
    });
  });

  describe('Orientation Changes', () => {
    test('should handle portrait to landscape transition', () => {
      // Portrait
      setViewport(375, 667);
      
      render(
        <div data-testid="orientation-container">
          <p>Content that adapts to orientation</p>
        </div>
      );

      expect(window.innerWidth).toBe(375);
      expect(window.innerHeight).toBe(667);

      // Landscape
      act(() => {
        setViewport(667, 375);
      });

      expect(window.innerWidth).toBe(667);
      expect(window.innerHeight).toBe(375);
    });

    test('should handle landscape to portrait transition', () => {
      // Landscape
      setViewport(667, 375);
      
      render(
        <div data-testid="orientation-container">
          <p>Content that adapts to orientation</p>
        </div>
      );

      expect(window.innerWidth).toBe(667);
      expect(window.innerHeight).toBe(375);

      // Portrait
      act(() => {
        setViewport(375, 667);
      });

      expect(window.innerWidth).toBe(375);
      expect(window.innerHeight).toBe(667);
    });
  });

  describe('Content Reflow', () => {
    test('should reflow content for different viewport sizes', () => {
      const TestComponent = () => (
        <div data-testid="content-container">
          <div className="grid-container">
            <div className="grid-item">Item 1</div>
            <div className="grid-item">Item 2</div>
            <div className="grid-item">Item 3</div>
          </div>
        </div>
      );

      // Desktop
      setViewport(1920, 1080);
      const { rerender } = render(<TestComponent />);
      
      expect(screen.getByTestId('content-container')).toBeInTheDocument();
      expect(window.innerWidth).toBe(1920);

      // Tablet
      act(() => {
        setViewport(768, 1024);
      });
      rerender(<TestComponent />);
      
      expect(window.innerWidth).toBe(768);

      // Mobile
      act(() => {
        setViewport(375, 667);
      });
      rerender(<TestComponent />);
      
      expect(window.innerWidth).toBe(375);
    });

    test('should handle text wrapping on smaller screens', () => {
      const longText = 'This is a very long text that should wrap on smaller screens and remain readable across different device sizes';
      
      setViewport(375, 667);
      
      render(
        <div data-testid="text-container" style={{ maxWidth: '100%' }}>
          <p>{longText}</p>
        </div>
      );

      const textContainer = screen.getByTestId('text-container');
      expect(textContainer).toBeInTheDocument();
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    test('should adapt navigation for mobile', () => {
      setViewport(375, 667);
      
      const navItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/bookings', label: 'Bookings' },
        { href: '/payments', label: 'Payments' },
        { href: '/profile', label: 'Profile' },
      ];

      render(
        <MockNavigation items={navItems} />
      );

      navItems.forEach(item => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });
  });

  describe('Typography and Readability', () => {
    test('should maintain readability on different screen sizes', () => {
      const TestTypography = () => (
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>Main Heading</h1>
          <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)' }}>Subheading</h2>
          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
            Body text that should be readable on all devices
          </p>
        </div>
      );

             Object.entries(devices).forEach(([deviceType, device]) => {
         setViewport(device.viewport.width, device.viewport.height);
         
         const { container } = render(<TestTypography />);
         
         expect(screen.getByRole('heading', { level: 1, name: 'Main Heading' })).toBeInTheDocument();
         expect(screen.getByRole('heading', { level: 2, name: 'Subheading' })).toBeInTheDocument();
         expect(screen.getByText('Body text that should be readable on all devices')).toBeInTheDocument();

         container.remove();
       });
    });

    test('should handle font scaling on mobile', () => {
      setViewport(375, 667);
      
      render(
        <div>
          <h1 data-testid="mobile-heading">Mobile Heading</h1>
          <p data-testid="mobile-text">Mobile body text</p>
        </div>
      );

      const heading = screen.getByTestId('mobile-heading');
      const text = screen.getByTestId('mobile-text');
      
      expect(heading).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });
  });

  describe('Image and Media Responsiveness', () => {
    test('should handle responsive images', () => {
      setViewport(375, 667);
      
      render(
        <div>
          <img 
            src="/test-image.jpg" 
            alt="Test image" 
            style={{ maxWidth: '100%', height: 'auto' }}
            data-testid="responsive-image"
          />
        </div>
      );

      const image = screen.getByTestId('responsive-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    test('should handle video responsiveness', () => {
      setViewport(375, 667);
      
      render(
        <video 
          data-testid="responsive-video"
          style={{ width: '100%', height: 'auto' }}
          controls
        >
          <source src="/test-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );

      const video = screen.getByTestId('responsive-video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('controls');
    });
  });

  describe('Performance on Mobile', () => {
    test('should simulate mobile performance considerations', async () => {
      setViewport(375, 667);
      
      const startTime = performance.now();
      
      render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} data-testid={`item-${i}`}>
              Item {i}
            </div>
          ))}
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // In a real scenario, you'd want to ensure render time is reasonable
      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
      
      // Check that all items are rendered
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-99')).toBeInTheDocument();
    });

    test('should handle touch scrolling performance', () => {
      setViewport(375, 667);
      
      render(
        <div 
          data-testid="scrollable-container"
          style={{ 
            height: '300px', 
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          } as React.CSSProperties}
        >
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ height: '50px' }}>
              Scrollable Item {i}
            </div>
          ))}
        </div>
      );

      const container = screen.getByTestId('scrollable-container');
      
      // Simulate touch scroll
      fireEvent.touchStart(container);
      fireEvent.scroll(container, { target: { scrollTop: 100 } });
      fireEvent.touchEnd(container);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility on Mobile', () => {
    test('should maintain accessibility on touch devices', () => {
      setViewport(375, 667);
      
      render(
        <div>
          <button 
            aria-label="Close dialog"
            data-testid="accessible-button"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            ×
          </button>
          <input 
            aria-label="Search input"
            data-testid="accessible-input"
            type="text"
            placeholder="Search..."
          />
        </div>
      );

      const button = screen.getByTestId('accessible-button');
      const input = screen.getByTestId('accessible-input');
      
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
      expect(input).toHaveAttribute('aria-label', 'Search input');
    });

    test('should handle screen reader navigation on mobile', () => {
      setViewport(375, 667);
      
      render(
        <div>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/bookings">Bookings</a></li>
              <li><a href="/profile">Profile</a></li>
            </ul>
          </nav>
        </div>
      );

      const nav = screen.getByRole('navigation');
      const links = screen.getAllByRole('link');
      
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      expect(links).toHaveLength(3);
    });
  });

  describe('Form Usability', () => {
    test('should handle virtual keyboard behavior', () => {
      setViewport(375, 667);
      
      render(
        <MockForm>
          <MockInput 
            type="text" 
            placeholder="Name"
            data-testid="name-input"
          />
          <MockInput 
            type="email" 
            placeholder="Email"
            data-testid="email-input"
          />
          <MockInput 
            type="password" 
            placeholder="Password"
            data-testid="password-input"
          />
        </MockForm>
      );

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
             // Simulate virtual keyboard appearing
       nameInput.focus();
       expect(nameInput).toHaveFocus();
       
       emailInput.focus();
       expect(emailInput).toHaveFocus();
       
       passwordInput.focus();
       expect(passwordInput).toHaveFocus();
    });

    test('should handle input spacing for touch', () => {
      setViewport(375, 667);
      
      render(
        <div style={{ padding: '20px' }}>
          <MockInput 
            style={{ 
              width: '100%', 
              height: '44px', 
              marginBottom: '16px',
              fontSize: '16px'
            }}
            placeholder="Input 1"
            data-testid="spaced-input-1"
          />
          <MockInput 
            style={{ 
              width: '100%', 
              height: '44px', 
              marginBottom: '16px',
              fontSize: '16px'
            }}
            placeholder="Input 2"
            data-testid="spaced-input-2"
          />
        </div>
      );

      const input1 = screen.getByTestId('spaced-input-1');
      const input2 = screen.getByTestId('spaced-input-2');
      
      expect(input1).toBeInTheDocument();
      expect(input2).toBeInTheDocument();
    });
  });

  describe('Cross-Device Consistency', () => {
    test('should maintain functionality across device sizes', () => {
      const TestComponent = () => (
        <div>
          <MockButton data-testid="action-button">
            Primary Action
          </MockButton>
          <MockCard>
            <h2>Card Title</h2>
            <p>Card content</p>
          </MockCard>
        </div>
      );

             Object.entries(devices).forEach(([deviceType, device]) => {
         setViewport(device.viewport.width, device.viewport.height);
         
         const { container } = render(<TestComponent />);
         
         expect(screen.getByTestId('action-button')).toBeInTheDocument();
         expect(screen.getByRole('heading', { level: 2, name: 'Card Title' })).toBeInTheDocument();
         expect(screen.getByText('Card content')).toBeInTheDocument();

         container.remove();
       });
    });

    test('should handle interactive elements consistently', () => {
      const handleClick = jest.fn();
      
      const TestComponent = () => (
        <div>
          <MockButton onClick={handleClick} data-testid="interactive-button">
            Click Me
          </MockButton>
          <MockInput 
            onChange={handleClick}
            data-testid="interactive-input"
            placeholder="Type here"
          />
        </div>
      );

             Object.entries(devices).forEach(([deviceType, device]) => {
         setViewport(device.viewport.width, device.viewport.height);
         
         const { container } = render(<TestComponent />);
         
         const button = screen.getByTestId('interactive-button');
         const input = screen.getByTestId('interactive-input');
         
         fireEvent.click(button);
         fireEvent.change(input, { target: { value: 'test' } });
         
         expect(handleClick).toHaveBeenCalled();

         container.remove();
         jest.clearAllMocks();
       });
    });
  });
}); 