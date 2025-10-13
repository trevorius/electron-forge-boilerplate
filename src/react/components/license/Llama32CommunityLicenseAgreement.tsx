import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '../chat/ChatInterface.helpers';

export const Llama32CommunityLicenseAgreement = ({ t }: { t: (key: string) => string }) => {
  return (
    <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={markdownComponents}
                  >
      {t('LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT.content')}
    </ReactMarkdown>
  );
};
