# unified-modal-system
Unified Modal System (UM)


**Unified Modal System (UM)** - это система модальных окон, которая определяет сама, что именно отображать.

- **UM_ShowModal()** - универсальное модальное окно с загрузкой AJAX
- **UM_SaveForm()** - универсальное сохранение формы в модале
- **UM_InlineAction()** - быстрое инлайн-обновление без модалов
- **UM_ConfirmAction()** - простое подтверждение действия
- **UM_Alert()** - системное всплывающее уведомление

**Преимущества:**
- 🔁 Автоопределение режима: одна функция работает и с jQuery UI, и без него
- 🧩 Единый интерфейс: плагины пишут конфиг, ядро берёт на себя рутину
- 🛡️ Безопасность: экранирование контента, проверка ответов, защита от XSS
- ♻️ Переиспользуемость: одна функция для всех плагинов
- 🎨 Гибкость: кастомные кнопки, стили, колбэки

📦 Установка

```
<!-- В <head> или перед </body> -->
<link href="/unified-modal-system/um-core.css" type="text/css" rel="stylesheet">
<script src="/unified-modal-system/um-core.js"></script>

<!-- Инициализация конфигурации (обязательно) -->
<script>
window.UM_CONFIG = {
    jquery_ui: true,  // или false
};
var lang = {
    close: 'Закрыть',
    save: 'Сохранить',
    cancel: 'Отмена'
    // ... другие строки
};
</script>
```

🧱 API Reference

🔹 1. **UM_ShowModal(opts)** — загрузка контента
Загружает контент по AJAX и показывает его в модальном окне. Поддерживает режим подтверждения с действием.

**ПАРАМЕТРЫ opts:**

| Параметр | Тип | По умолчанию | Описание |
| ----------- | ----------- | ----------- | ----------- |
| url 		| string 		| обязательно 					| Адрес для AJAX-запроса |
| data 		| object 		| {} 							| Данные для POST-запроса |
| title 	| string 		| 'Информация' 					| аголовок окна |
| descr 	| string 		| '' 							| Текст-описание над контентом |
| width 	| number 		| 500 							| Ширина окна в пикселях |
| className | string 		| '' 							| Дополнительный CSS-класс модала |
| action 	| boolean 		| false 						| Если true → режим подтверждения (кнопки "Отмена"/"Выполнить") |
| confirmText | string 		| 'Выполнить' 					| Текст кнопки действия (при action: true) |
| buttons 	| array 		| `[{text:'Закрыть', click:...}]` | Кастомные кнопки: `[{text, class, type, click}, ...]` |
| onLoad 	| function 		| null 							| Колбэк после загрузки: `(html, api) => {}` |
| onSuccess | function 		| null 							| Колбэк при успехе (при action: true) |
| onError 	| function 		| null 							| Колбэк при ошибке (при action: true) |
| successMessage | string 	| 'Операция выполнена' 			| Текст уведомления об успехе |

**Объект api в onLoad:**
```
{
    element: modalElement,  // DOM-элемент модала
    close: function() {}    // Функция закрытия модала
	setContent: modalElement,
}
```

| Метод | Для чего |
| ----------- | ----------- |
| api.setContent(newHtml) 	| Заменить контент модала после загрузки |
| api.setButtons(newButtons) | Поменять кнопки динамически (например, после сохранения) |
| api.element 				| Доступ к DOM-элементу модала |
| api.close() 				| Программное закрытие |

```
// Замена кнопок после отправки данных.
// Внутри onSuccess или после сохранения:
api.setButtons([
    { text: lang.close || 'Закрыть', class: 'primary', click: function(close) { close(); } }
]);
```

ПРИМЕРЫ:

- Загрузка справки
```
UM_ShowModal({
    url: '/ajax/help.php',
    title: 'Справка',
    width: 600
});
```

- Подтверждение удаления с описанием
```
UM_ShowModal({
    url: '/ajax/delete.php',
    data: { id: 123 },
    title: 'Удаление',
    descr: 'Вы точно хотите удалить эту запись?',
    action: true,
    confirmText: 'Удалить',
    onSuccess: function() {
        location.reload();
    }
});
```

- Загрузка с инициализацией скриптов после
```
UM_ShowModal({
    url: '/plugins/settings/ajax.php',
    title: 'Настройки',
    onLoad: function(html, api) {
        // Инициализируем плагины внутри модала
        if (typeof initDatePicker === 'function') {
            initDatePicker(api.element);
        }
    }
});
```

- Пример с кастомными функциями ShowLoading, HideLoading и ShowOrHide
```
function plugins_del(nid) {
	ShowLoading('Удаление заявки');
    UM_ShowModal({
        url: '/plugins/lib/ajax.php',
        data: { del: 'dellete', file_id: nid },
        title: 'Удаление заявки',
        descr: 'Вы точно хотите удалить заявку?',
        width: 400,
        action: true,             // Включаем режим подтверждения
        confirmText: 'Удалить',   // Текст кнопки действия
        onLoad: function() { HideLoading(); },
        onError: function() { HideLoading(); },
        onSuccess: function(response) {
            if (typeof ShowOrHide === 'function') {
                ShowOrHide('plugins_' + nid);
            }
        }
    });
}
```

- Пример просмотра профиля
```

// Данные текущего пользователя (опционально)
var usROW = $login ? 'true' : 'false';
var usROW_name = 'admin';
var usROW_id = '1';

function showProfile(uid, user, showUrl, editUrl) {
    var isOwn = usROW && (user === usROW_name) && (uid == usROW_id);
    
    var buttons = [
        { text: 'Просмотреть', class: 'primary', click: function(c){ document.location = showUrl; } }
    ];
    if (isOwn && editUrl) {
        buttons.push({ text: 'Редактировать', click: function(c){ document.location = editUrl; } });
    }
    buttons.push({ text: 'Закрыть', click: function(c){ c(); } });
    
    UM_ShowModal({
        url: '/ajax/profile.php',
        data: { user_id: uid, user_name: user },
        title: 'Профиль: ' + user,
        width: 500,
        className: 'profile-modal',
        buttons: buttons,
        onLoad: function(html, api) {
            api.setContent('<div class="profile-content">' + html + '</div>');
        }
    });
}
```

КНОПКИ:
```
buttons: [
    {
        text: 'Отмена',
        class: 'secondary',  // secondary | primary | danger
        type: 'button',      // button | submit (для форм)
        click: function(close) { close(); }
    },
    {
        text: 'Сохранить',
        class: 'primary',
        type: 'submit',      // нативный submit формы
        click: function(close) { /* не нужен при type:'submit' */ }
    }
]
```

🔹 2. **UM_SaveForm(cfg)** — сохранение форм
Универсальная функция для отправки любой формы внутри модала. Обрабатывает успех, ошибки валидации, обновление интерфейса.

**ПАРАМЕТРЫ cfg:**

| Параметр | Тип | По умолчанию | Описание |
| ----------- | ----------- | ----------- | ----------- |
| modal / element  	 | DOM Element  	 | обязательно 			 | Элемент модала (из api.element) |
| close 			 | function 		 | обязательно 			 | Функция закрытия модала (из api.close) |
| url 				 | string 			 | обязательно 			 | Адрес для отправки формы |
| data 				 | object 			 | {} 					 | Дополнительные данные (добавятся к данным формы) |
| successMsg 		 | string 			 | 'Данные сохранены' 	 | Текст уведомления об успехе |
| showResult 		 | boolean 			 | false 				 | Если true → показать ответ сервера внутри модала |
| autoClose 		 | boolean 			 | true 				 | Автозакрытие модала после успеха |
| onSuccess 		 | function 		 | null 				 | Колбэк при успехе: `(data) => {}` |

**ПРИМЕРЫ:**

- Базовое сохранение
```
form.onsubmit = function(e) {
    e.preventDefault();
    UM_SaveForm({
        modal: api.element,
        close: api.close,
        url: '/ajax/save.php',
        data: { id: 123 },
        successMsg: 'Запись обновлена'
    });
};
```

- С показом результата в модале
```
UM_SaveForm({
    modal: api.element,
    close: api.close,
    url: '/ajax/process.php',
    showResult: true,           // показать ответ сервера
    autoClose: false,           // ждать клика пользователя
    successMsg: 'Готово!',
    onSuccess: function(data) {
        console.log('Server response:', data);
    }
});
```

- С дополнительными данными
```
UM_SaveForm({
    modal: api.element,
    close: api.close,
    url: '/ajax/upload.php',
    data: {
        token: csrfToken,
        extra: 'value'
    },
    successMsg: 'Файл загружен'
});
```

**Что происходит внутри:**
1. Собирает данные формы через FormData (поддерживает файлы, массивы)
2. Отправляет запрос (автоопределение: jQuery / Fetch)
3. При успехе:
	- Показывает msg_alert('success') или обновляет контент модала (если showResult: true)
	- Меняет кнопки на одну "Закрыть"
	- Закрывает модал автоматически (если autoClose: true)
	- Выполняет onSuccess
4. При ошибке валидации:
	- Обновляет .modal-body ответом сервера (форма с ошибками)
	- Перепривязывает onsubmit для повторной отправки
	- Показывает msg_alert('warning')


Редактирование
```
function plugins_editor(id) {
    UM_ShowModal({
        url: '/plugins/lib/ajax.php',
        data: { edit: 'editor', file_id: id },
        title: 'Редактирование заказа ' + id,
        width: 580,
        buttons: [
            { text: lang.cancel || 'Отмена', class: 'secondary', click: function(close) { close(); } },
            { text: lang.save || 'Сохранить', type: 'submit', class: 'primary' } // 🔑 type:'submit'
        ],
        onLoad: function(html, api) {
            var form = api.element.querySelector('form');
            if (form) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    UM_SaveForm({
                        modal: api.element,
                        close: api.close,
                        url: '/plugins/lib/ajax.php',
                        data: { edit: 'editor_save', file_id: id },
                        successMsg: 'Заказ обновлён',
                        showResult: true, 				// Показывать ответ сервера в модале true - да, false - нет
                        onSuccess: function() {
                            if (typeof loadOrders === 'function') loadOrders();
                        }
                    });
                };
            }
        }
    });
}
```

**КЛАССЫ КНОПОК:**

```
class: 'primary'    // синий фон, белый текст (основное действие)
class: 'secondary'  // серый фон, рамка (второстепенное)
class: 'danger'     // красный фон, белый текст (удаление, бан)
// без class → белый фон, серая рамка
```

**ТИПЫ КНОПОК:**
```
type: 'button'  // обычная кнопка (по умолчанию)
type: 'submit'  // нативная отправка формы (рекомендуется для "Сохранить")
```

**ПРИМЕРЫ КНОПОК:**

- Только "Закрыть"
```
buttons: [{ text: 'Закрыть', click: function(c){ c(); } }]
```
- "Отмена" + "Сохранить" (с сабмитом)
```
buttons: [
    { text: 'Отмена', class: 'secondary', click: function(c){ c(); } },
    { text: 'Сохранить', class: 'primary', type: 'submit' }
]
```

- Три кнопки с кастомной логикой
```
buttons: [
    { text: 'Назад', click: function(c){ c(); } },
    { text: 'Печать', class: 'secondary', click: function(){ window.print(); } },
    { text: 'Готово', class: 'primary', click: function(c){ c(); } }
]
```

🔹 3. **UM_InlineAction(cfg)** — Инлайн-обновление без модалов
Лёгкая универсальная обёртка над AJAX для мгновенного обновления счётчиков, рейтингов, статусов и элементов страницы. Работает с jQuery и нативным fetch, не требует модальных окон, полностью управляется одним колбэком.

**ПАРАМЕТРЫ cfg:**

| Параметр | Тип | По умолчанию | Описание |
| ----------- | ----------- | ----------- | ----------- |
| url 			 | string 		 | обязательно 		 | Адрес для AJAX-запроса |
| data 			 | object 		 | {} 				 | Данные для отправки (POST) |
| callback 		 | function 	 | null 			 | Обработчик ответа: `(result) => {}`. Если задан, target игнорируется |
| target 		 | string 		 | null 			 | CSS-селектор элемента для авто-обновления (если callback не указан) |
| dataType 		 | string 		 | 'json' 			 | 'json' (автопарсинг) или 'text' (сырая строка) |
| method 		 | string 		 | 'POST' 			 | HTTP-метод запроса |

ПРИМЕР:

```
function plugins_rate(id) {
    UM_InlineAction({
        url: '/plugins/lib/rating.php',
        data: { order: id },
        dataType: 'json',
        loading: true,
        callback: function(data) {
            if (data.msg) {
                if (typeof UM_Alert === 'function') UM_Alert('success', data.msg);
            } else {
                if (data.rating > 0) {
                    $("#like-rating-"+id).removeAttr('class').addClass("like-rating-plus");
                }
                $("#like-rating-"+id).html(data.rating);
            }
        }
    });
}
```

Быстрое обновление счётчика (без колбэка)
```
// Сервер вернёт: { views: 1240 }
UM_InlineAction({
    url: '/ajax/views.php',
    data: { news_id: 45 },
    target: '#news-views-45'  // элемент обновится автоматически
});
```

Переключение статуса + обработка ошибок сети
```
function toggleOrderStatus(orderId) {
    UM_InlineAction({
        url: '/ajax/order_status.php',
        data: { id: orderId },
        callback: function(res) {
            if (res.error) {
                if (typeof UM_Alert === 'function') UM_Alert('error', res.error);
                return;
            }
            var el = document.querySelector('#status-' + orderId);
            if (el) {
                el.textContent = res.status;
                el.className = 'badge badge-' + res.class;
            }
        }
    });
}
```

```
UM_InlineAction({
    url: '/ajax/like.php',
    data: { id: 123 },
    callback: function(res) {
        if (res.liked) $('#like-btn-123').addClass('active');
        $('#like-count-123').text(res.count);
    }
});
```

Бан пользователя
```
function banUser(uid, userName, reason) {
    UM_ShowModal({
        url: '/ajax/users.php',
        data: { action: 'ban', user_id: uid, reason: reason },
        title: 'Бан пользователя',
        descr: 'Заблокировать <b>' + userName + '</b>?<br><small>Причина: ' + (reason || 'не указана') + '</small>',
        width: 450,
        action: true,
        confirmText: 'Заблокировать',
        onSuccess: function(data) {
            // Обновляем статус в интерфейсе
            var el = document.getElementById('user_status_' + uid);
            if (el) el.innerHTML = '<span class="text-danger">Заблокирован</span>';
            UM_Alert('success', 'Пользователь заблокирован');
        },
        onError: function(data) {
            // Кастомная обработка ошибок
            if (data && data.indexOf('already_banned') !== -1) {
                UM_Alert('warning', 'Пользователь уже заблокирован');
            } else if (data && data.indexOf('cannot_ban_admin') !== -1) {
                UM_Alert('error', 'Нельзя заблокировать администратора');
            }
        }
    });
}
```

🔹 4. **UM_ConfirmAction(message, onConfirm, onCancel)** — подтверждение действия
Показывает окно подтверждения с двумя кнопками. После подтверждения выполняет ваш колбэк.

**ПАРАМЕТРЫ:**

| Параметр | Тип | Описание |
| ----------- | ----------- | ----------- |
| message 		 | string 		 | Текст сообщения в окне |
| onConfirm 	 | function 	 | Выполнится после нажатия "Удалить" / "Да" |
| onCancel 		 | function 	 | Выполнится после нажатия "Отмена" (опционально) |

**ПРИМЕРЫ:**

- Простое удаление с редиректом через кастомную функцию **ConfirmDelete**
```
function ConfirmDelete(id, url) {
    UM_ConfirmAction('Удалить запись?', function() {
        document.location = url;
    });
}
```

- Подтверждение с кастомной логикой
```
UM_ConfirmAction('Очистить кэш?', function() {
    fetch('/ajax/clear.php').then(() => {
        UM_Alert('success', 'Кэш очищен');
    });
});
```

🔹 5. **UM_Alert** - Системное всплывающее уведомление.

ПРИМЕРЫ:

- Простое уведомление
```
UM_Alert('success', 'Данные сохранены');
```

- С кастомными настройками
```
UM_Alert('warning', 'Проверьте заполнение полей', {
    duration: 5000,
    position: 'top-left',
    clickToClose: false
});
```

- С HTML-разметкой
```
UM_Alert('error', '<b>Ошибка:</b> Неверный формат email');
```

ПРИМЕЧАНИЕ:
=

1. Экранируйте вывод на сервере
```
// Опасно:
echo "<div>$userInput</div>";

// Безопасно:
echo "<div>" . htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8') . "</div>";
```

2. Возвращайте чёткие ответы с сервера
```
// Для успеха:
echo json_encode(['status' => 'ok', 'rating' => 5], JSON_UNESCAPED_UNICODE);

// Для ошибок валидации: возвращайте форму с классами ошибок
echo '<form id="myForm"><input class="error" ...></form>';
```

3. Не дублируйте логику в плагинах
```
// Не делайте так:
function plugins_save() {
    $.post(...);
    // 50 строк обработки...
}

// Делайте так:
function plugins_save() {
    UM_SaveForm({ /* конфиг */ }); // вся логика в одном месте
}
```