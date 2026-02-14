import pymysql
import requests
from bs4 import BeautifulSoup
import re

config = {
    'host': 'localhost',
    'user': 'root',
    'password': '1234',
    'database': 'fustar_web'
}

def connect_to_database():
    try:
        conn = pymysql.connect(
            host=config['host'],
            user=config['user'],
            password=config['password'],
            database=config['database'],
            charset='utf8'
        )
        return conn
    except pymysql.Error as e:
        print("数据库连接错误:", e)
        return None


def get_notices(url, site):
    # 经过测试：教务处，体科院可用
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')

    notices = []
    for item in soup.find_all('div', class_='column-news-item'):
        title = item.find('span', class_='column-news-title').text.strip()
        href = item.find('span', class_='column-news-title').find('a')['href']
        date = item.find('span', class_='column-news-date').text.strip()
        notices.append({'title': title, 'url': href, 'time': date, 'origin': site})
    return notices


def get_notices_for_xgb(url, site):
    # 经过测试：学工部可用
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')

    notices = []
    for item in soup.find_all('li'):
        title_tag = item.find('span', class_='news_title')
        if title_tag and title_tag.find('a'):
            title = title_tag.find('a').text.strip()
            href = title_tag.find('a')['href']
            date = item.find('span', class_='news_date').text.strip()
            notices.append({'title': title, 'url': href, 'time': date, 'origin': site})
    return notices


def get_notices_for_zsb(url, site):
    # 经过测试：招生办可用
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')

    notices = []
    for item in soup.find_all('li'):
        title_tag = item.find('span', class_='news_title')
        if title_tag and title_tag.find('a'):
            title = title_tag.find('a').text.strip()
            href = title_tag.find('a')['href']
            date = item.find('span', class_='news_meta').text.strip()
            notices.append({'title': title, 'url': href, 'time': date, 'origin': site})
    return notices


def check_and_insert_notices(conn, notices):
    cursor = conn.cursor()
    for notice in notices:
        notice['title'] = re.sub(r'[^\w\s,.!?-]+', '', notice['title'])
        cursor.execute("SELECT * FROM announcements WHERE title=%s AND url=%s", (notice['title'], notice['url']))
        result = cursor.fetchone()
        if not result:
            cursor.execute("INSERT INTO announcements (title, origin, time, url, content) VALUES (%s, %s, %s, %s, %s)",
                           (notice['title'], notice['origin'], notice['time'], notice['url'], notice['content']))
            print(f"插入新公告: {notice['title']}")
    conn.commit()


def get_notices_from_database(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM announcements")
    return cursor.fetchall()

def check():
    conn = connect_to_database()
    if conn:
        # 获取数据库中已有的公告
        db_notices = get_notices_from_database(conn)
        # 获取当前网站的公告
        target = {"教务处": "jwc", "体科院": "tky", "学工部": "stu", "招生办": "zsb", "招生办招考": "zsb"}
        current_notices = get_notices("https://jwc.fjnu.edu.cn/tzgg_9107/list.htm", "教务处")
        current_notices += get_notices("https://tky.fjnu.edu.cn/tzjk/list.htm", "体科院")
        current_notices += get_notices_for_xgb("https://stu.fjnu.edu.cn/tzxxcj/list2.htm", "学工部")
        current_notices += get_notices_for_zsb("https://zsb.fjnu.edu.cn/17232/list.htm", "招生办")
        current_notices += get_notices_for_zsb("https://zsb.fjnu.edu.cn/17233/list1.htm", "招生办招考")
        # 过滤出新的公告
        new_notices = [notice for notice in current_notices if not any(
            db_notice[1] == re.sub(r'[^\w\s,.!?-]+', '', notice['title']) and db_notice[4] == notice['url'] for db_notice in db_notices)]
        
        # 处理新的公告
        n_notices = []
        for n in new_notices:
            if n['url'][:4] != "http":
                notice_url = f"https://{target[n['origin']]}.fjnu.edu.cn{n['url']}"
            else:
                notice_url = n['url']
            if 'fjnu.edu.cn' in notice_url:
                n_response = requests.get(notice_url)
                n_response.encoding = 'utf-8'
                n_content = n_response.text
                if "您当前ip并非校内地址，该信息仅允许校内地址访问" in n_content:
                    description = "本公告仅允许校内IP地址访问。"
                else:
                    soup = BeautifulSoup(n_content, 'html.parser')  # 创建 BeautifulSoup 对象
                    description_tag = soup.find('meta', attrs={'name': 'description'})
                    if description_tag:
                        description = description_tag['content']
                        if len(description) > 200:
                            description = description[:200] + "..."
                    else:
                        description = "未能获取到描述文本。"
            else:
                description = "本公告在站外，无法获取描述。"
            n_notices.append({'title': n['title'], 'url': notice_url, 'time': n['time'], 'origin': n['origin'], 'content': description})
        
        # 将新公告插入到数据库
        check_and_insert_notices(conn, n_notices)
        conn.close()
    return

if __name__ == "__main__":
    check()