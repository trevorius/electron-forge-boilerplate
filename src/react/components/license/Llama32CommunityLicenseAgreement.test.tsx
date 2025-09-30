import { render, screen } from '@testing-library/react';
import { Llama32CommunityLicenseAgreement } from './Llama32CommunityLicenseAgreement';

// Mock react-markdown and plugins
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {}
}));

jest.mock('remark-breaks', () => ({
  __esModule: true,
  default: () => {}
}));

jest.mock('../chat/ChatInterface.helpers', () => ({
  markdownComponents: {}
}));

describe('Llama32CommunityLicenseAgreement', () => {
  it('should render the license content', () => {
    const mockT = jest.fn((key: string) => {
      if (key === 'LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT.content') {
        return '# LLAMA 3.2 COMMUNITY LICENSE AGREEMENT\n\nTest content';
      }
      return key;
    });

    render(<Llama32CommunityLicenseAgreement t={mockT} />);

    expect(mockT).toHaveBeenCalledWith('LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT.content');
  });

  it('should render ReactMarkdown with correct content', () => {
    const mockT = jest.fn((key: string) => {
      return '# Heading\n\nParagraph text';
    });

    render(<Llama32CommunityLicenseAgreement t={mockT} />);

    // Check that markdown component is rendered
    const markdown = screen.getByTestId('markdown');
    expect(markdown).toBeInTheDocument();
    expect(markdown).toHaveTextContent('# Heading');
  });

  it('should handle empty content', () => {
    const mockT = jest.fn(() => '');

    const { container } = render(<Llama32CommunityLicenseAgreement t={mockT} />);

    expect(container.firstChild).toBeInTheDocument();
    const markdown = screen.getByTestId('markdown');
    expect(markdown).toHaveTextContent('');
  });

  it('should pass translation key content to markdown', () => {
    const testContent = 'Test license content';
    const mockT = jest.fn(() => testContent);

    render(<Llama32CommunityLicenseAgreement t={mockT} />);

    const markdown = screen.getByTestId('markdown');
    expect(markdown).toHaveTextContent(testContent);
  });
});
