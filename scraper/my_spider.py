from insert_mysql import insert_article
import scrapy

class AnimeNewsSpider(scrapy.Spider):
    name = "anime_news"
    start_urls = ['https://www.animenewsnetwork.com/']

    def parse(self, response):
        topfeed_div = response.css('div#topfeed')

        for article in topfeed_div.css('div.herald.box.news'):
            link = article.css('div.wrap a::attr(href)').get()

            if link:
                full_url = response.urljoin(link)
                yield scrapy.Request(url=full_url, callback=self.parse_article)

    def parse_article(self, response):
        title = response.css('div#page-title h1::text').getall()
        title = ''.join(title).strip()
        title = ' '.join(title.split())

        content = response.css('div.meat *::text').getall()
        content = ''.join(content).strip()
        content = ' '.join(content.split())

        title = title.encode('utf-8').decode('utf-8')
        content = content.encode('utf-8').decode('utf-8')

        insert_article(title, content)

        print('test -------->', title, content)

        yield {
            'title': title,
            'content': content,
        }