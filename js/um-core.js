/**
 * Unified Modal System (UM)
 * @description Универсальная система модальных окон, подтверждений и уведомлений
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 [KachalkinGeorg + Qwen Ассистент / Unified Modal System (UM)]
 * @see https://github.com/KachalkinGeorg/unified-modal-system
 */

/**
 * UM_ShowModal — универсальное модальное окно с загрузкой AJAX
 * Автоопределяет режим (jQuery UI / Custom), управляет лоадером, ошибками.
 * @param {Object} opts Конфигурация: {url, data, title, buttons, onLoad, ...}
 * @returns {void}
 */
function UM_ShowModal(opts) {
    var url = opts.url || '';
    var postData = opts.data || {};
    var title = opts.title || 'Информация';
    var width = opts.width || 500;
    var descr = opts.descr || '';
    var isAction = !!opts.action;
    var confirmText = opts.confirmText || 'Выполнить';
    var onSuccess = opts.onSuccess || null;
    var onError = opts.onError || null;
    var buttons = opts.buttons || [];
    var onLoad = opts.onLoad || null;

    // Функция выполнения AJAX-запроса (для action-режима)
    var runAjax = function() {
        var handleResponse = function(resp) {
            var data = (resp || '').trim();
            var isOk = (data.toLowerCase() === 'ok') || 
                       (data.indexOf('<form') === -1 && data.toLowerCase().indexOf('error') === -1);
            
            if (isOk) {
                if (typeof UM_Alert === 'function') UM_Alert('success', opts.successMessage || 'Операция выполнена успешно');
                if (typeof onSuccess === 'function') onSuccess(data);
            } else {
                var errMsg = data || 'Произошла ошибка';
                if (data.indexOf('<') !== -1) {
                    var tmp = document.createElement('div'); tmp.innerHTML = data;
                    errMsg = tmp.textContent || tmp.innerText || errMsg;
                }
                if (typeof UM_Alert === 'function') UM_Alert('error', errMsg);
                if (typeof onError === 'function') onError(data);
            }
        };

        if (typeof $.post !== 'undefined' && window.UM_CONFIG && window.UM_CONFIG.jquery_ui === 'true') {
            $.post(url, postData, handleResponse).fail(function(){ if (typeof UM_Alert === 'function') UM_Alert('error', 'Ошибка соединения'); });
        } else {
            var fd = new FormData();
            for(var k in postData) if(postData.hasOwnProperty(k)) fd.append(k, postData[k]);
            fetch(url, {method:'POST', body:fd}).then(function(r){return r.text();}).then(handleResponse).catch(function(){ if (typeof UM_Alert === 'function') UM_Alert('error', 'Ошибка соединения'); });
        }
    };

    // Если action → кнопки подтверждения
    if (isAction) {
        buttons = [
            { text: lang.cancel || 'Отмена', class: 'secondary', click: function(close){ close(); } },
            { text: confirmText, class: 'primary', click: function(close){ close(); runAjax(); }}
        ];
    }

    // Вспомогательная: экранирование HTML
    var esc = function(s){ if(!s) return ''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML; };

    // Функция отрисовки модала
    var renderModal = function(fetchedHtml) {
        var isJquery = window.UM_CONFIG && window.UM_CONFIG.jquery_ui === 'true' && typeof $.ui !== 'undefined';

        // Тело: descr + загруженный контент
        var bodyHtml = '';
        if (descr) bodyHtml += '<div style="padding:12px 8px;margin-bottom:12px;line-height:1.5;">' + esc(descr) + '</div>';
        if (fetchedHtml) bodyHtml += fetchedHtml;

        if (isJquery) {
            // jQuery UI режим
            var id = 'ajax_m_' + Math.floor(Math.random()*10000);
            $('body').prepend('<div id="'+id+'" style="display:none;"></div>');
            var gk_dialog = $('#'+id).html(bodyHtml);
            
            var uiBtns = {};
            for(var i=0; i<buttons.length; i++){
                (function(btn){
                    uiBtns[btn.text] = function() {
                        var dlg = $(this);
                        if (btn.type === 'submit') {
                            var form = dlg.find('form').get(0);
                            if (form) {
                                var e = new Event('submit', { bubbles: true, cancelable: true });
                                if (!form.dispatchEvent(e)) return;
                            }
                        }
                        if (typeof btn.click === 'function') btn.click.call(dlg[0], function() { dlg.dialog('close'); });
                    };
                })(buttons[i]);
            }
            
            gk_dialog.dialog({
                zIndex: 600,
                width: width,
                modal: true,
                resizable: false,
                hide: 'fade',
                buttons: uiBtns,
                title: title,
                close: function() { $(this).dialog('destroy').remove(); }
            });

            // API с методами setContent / setButtons
            var api = {
                element: gk_dialog[0],
                close: function() { gk_dialog.dialog('close'); },
                setContent: function(newHtml) {
                    gk_dialog.html(newHtml);
                },
                setButtons: function(newButtons) {
                    var newUiBtns = {};
                    for (var j = 0; j < newButtons.length; j++) {
                        (function(btn) {
                            newUiBtns[btn.text] = function() {
                                var dlg = gk_dialog;
                                if (btn.type === 'submit') {
                                    var form = dlg.find('form').get(0);
                                    if (form) {
                                        var e = new Event('submit', { bubbles: true, cancelable: true });
                                        if (!form.dispatchEvent(e)) return;
                                    }
                                }
                                if (typeof btn.click === 'function') btn.click.call(dlg[0], function() { dlg.dialog('close'); });
                            };
                        })(newButtons[j]);
                    }
                    gk_dialog.dialog('option', 'buttons', newUiBtns);
                }
            };
            
            if (onLoad) onLoad(fetchedHtml, api);
            
        } else {
            // Кастомный режим
            var modal = document.createElement('div');
            modal.className = 'gk-modal um_modal ' + (opts.className || '');
            modal.innerHTML = 
                '<div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #eee;">'+
                    '<div style="font-weight:600;font-size:1.1em;">'+esc(title)+'</div>'+
                    '<a role="button" class="modal-close" style="cursor:pointer;font-size:1.5em;color:#666;">&times;</a>'+
                '</div>'+
                '<div class="modal-body" style="overflow-y:auto;flex:1;padding:0 4px;max-height:70vh;">'+bodyHtml+'</div>'+
                '<div class="modal-footer" style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;text-align:right;">'+
                    buttons.map(function(b, i) {
                        var typeAttr = b.type === 'submit' ? 'type="submit"' : 'type="button"';
                        var style = b.class === 'primary' ? 'background:#007bff;color:#fff;border:none;' : 
                                    (b.class === 'danger' ? 'background:#dc3545;color:#fff;border:none;' : 'border:1px solid #ccc;background:#fff;');
                        return '<button data-idx="'+i+'" '+typeAttr+' style="margin-left:8px;padding:8px 20px;border-radius:4px;cursor:pointer;'+style+'">'+esc(b.text)+'</button>';
                    }).join('')+
                '</div>';
            Object.assign(modal.style, {position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10002,borderRadius:'8px',boxShadow:'0 4px 30px rgba(0,0,0,0.25)',maxWidth:'95%',width:width+'px',background:'#fff',display:'flex',flexDirection:'column'});
            
            var bd = document.createElement('div'); bd.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:10001;';
            document.body.appendChild(bd); document.body.appendChild(modal);
            
            var form = modal.querySelector('form');
            if (form) {
                modal.querySelectorAll('button[type="submit"]').forEach(function(btn) {
                    if (!form.id) form.id = 'gk_form_' + Date.now();
                    btn.setAttribute('form', form.id);
                });
            }
            
            var closeFn = function(){ if(modal.parentNode) modal.remove(); if(bd.parentNode) bd.remove(); document.removeEventListener('keydown',onKey); };
            var onKey = function(e){ if(e.key=='Escape') closeFn(); }; document.addEventListener('keydown', onKey);
            
            var cb = modal.querySelector('.modal-close'); if(cb) cb.onclick = function(e){ e.preventDefault(); closeFn(); };
            
            var ftr = modal.querySelector('.modal-footer');
            if(ftr) ftr.querySelectorAll('button[data-idx]').forEach(function(btn, i){
                var h = buttons[i].click; if(h) btn.onclick = function(e){ e.preventDefault(); h.call(modal, closeFn); };
            });
            bd.onclick = closeFn;

            // API с методами setContent / setButtons
            var api = {
                element: modal,
                close: closeFn,
                setContent: function(newHtml) {
                    var container = modal.querySelector('.modal-body');
                    if (container) container.innerHTML = newHtml;
                },
                setButtons: function(newButtons) {
                    var footer = modal.querySelector('.modal-footer');
                    if (!footer && newButtons.length > 0) {
                        footer = document.createElement('div');
                        footer.className = 'modal-footer';
                        footer.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px solid #eee;text-align:right;';
                        modal.appendChild(footer);
                    }
                    if (footer) {
                        footer.innerHTML = newButtons.map(function(b, i) {
                            var typeAttr = b.type === 'submit' ? 'type="submit"' : 'type="button"';
                            var style = b.class === 'primary' ? 'background:#007bff;color:#fff;border:none;' : 
                                        (b.class === 'danger' ? 'background:#dc3545;color:#fff;border:none;' : 'border:1px solid #ccc;background:#fff;');
                            return '<button data-idx="'+i+'" '+typeAttr+' style="margin-left:8px;padding:8px 20px;border-radius:4px;cursor:pointer;'+style+'">'+esc(b.text)+'</button>';
                        }).join('');
                        
                        // Перепривязываем обработчики
                        footer.querySelectorAll('button[data-idx]').forEach(function(btn, idx) {
                            var handler = newButtons[idx].click;
                            if (handler) {
                                btn.onclick = function(e) {
                                    e.preventDefault();
                                    handler.call(modal, closeFn);
                                };
                            }
                        });
                    }
                }
            };
            
            if (onLoad) onLoad(fetchedHtml, api);
        }
    };

    // Запуск
    var useJq = (window.UM_CONFIG && 
                (window.UM_CONFIG.jquery_ui === true || window.UM_CONFIG.jquery_ui === 'true')) && 
                typeof $.post !== 'undefined';

    if (isAction) {
        renderModal('');
    } else {
        if (useJq) {
            // Режим jQuery UI
            $.post(url, postData, renderModal).fail(function(){ 
                if (typeof UM_Alert === 'function') UM_Alert('error', 'Ошибка загрузки'); 
            });
        } else {
            // Режим Fetch (Vanilla JS)
            var fd = new FormData(); 
            for(var k in postData) if(postData.hasOwnProperty(k)) fd.append(k, postData[k]);
            
            fetch(url, { method:'POST', body:fd })
                .then(function(r){ return r.text(); })
                .then(renderModal)
                .catch(function(err){ 
                    console.warn('UM_ShowModal fetch error:', err);
                    if (typeof UM_Alert === 'function') UM_Alert('error', 'Ошибка загрузки: ' + url); 
                });
        }
    }
}

/**
 * UM_SaveForm — универсальное сохранение формы в модале
 * Отправляет форму, обрабатывает успех/ошибки, обновляет интерфейс.
 * @param {Object} cfg {modal, close, url, data, onSuccess, ...}
 */
function UM_SaveForm(cfg) {
    var modal = cfg.modal || cfg.element;
    var closeFn = cfg.close;
    var url = cfg.url;
    var successMsg = cfg.successMsg || 'Данные успешно сохранены';
    var onSuccess = cfg.onSuccess || null;
    var additionalData = cfg.data || {};

    if (!modal || !url) { console.warn('UM_SaveForm: отсутствуют modal или url'); return; }

    var form = modal.querySelector('form');
    if (!form) { console.warn('UM_SaveForm: форма не найдена в модале'); return; }

    // Сбор данных через FormData
    var fd = new FormData(form);
    for (var k in additionalData) {
        if (additionalData.hasOwnProperty(k)) fd.append(k, additionalData[k]);
    }

    // ВСПОМОГАТЕЛЬНАЯ: обновление кнопок модала (внутри функции)
    var _setModalButtons = function(modalEl, btns) {
        if (!btns || !btns.length) return;

        // Режим jQuery UI
        if (typeof $.ui !== 'undefined' && $(modalEl).data('ui-dialog')) {
            var map = {};
            for (var i = 0; i < btns.length; i++) {
                (function(btn) {
                    map[btn.text] = function() {
                        if (typeof btn.click === 'function') {
                            btn.click.call(this, function() { $(this).dialog('close'); });
                        }
                    };
                })(btns[i]);
            }
            $(modalEl).dialog('option', 'buttons', map);
            return;
        }

        // Кастомный режим
        var footer = modalEl.querySelector('.modal-footer');
        if (!footer) return;

        footer.innerHTML = btns.map(function(b, i) {
            var s = b.class === 'primary' ? 'background:#007bff;color:#fff;border:none;' :
                    (b.class === 'danger' ? 'background:#dc3545;color:#fff;border:none;' : 'border:1px solid #ccc;background:#fff;');
            return '<button type="button" data-i="' + i + '" style="margin-left:8px;padding:8px 20px;border-radius:4px;cursor:pointer;' + s + '">' + b.text + '</button>';
        }).join('');

        var newBtns = footer.querySelectorAll('button[data-i]');
        for (var j = 0; j < newBtns.length; j++) {
            (function(idx, btnEl) {
                var handler = btns[idx].click;
                btnEl.onclick = function(e) {
                    e.preventDefault();
                    if (typeof handler === 'function') {
                        handler.call(modalEl, function() {
                            if (modalEl._closeFn) modalEl._closeFn();
                        });
                    }
                };
            })(j, newBtns[j]);
        }
    };

    // ВСПОМОГАТЕЛЬНАЯ: обновление контента модала (учитывает режим)
    var _updateModalBody = function(modalEl, newHtml) {
        var body = null;
        
        // Определяем режим и ищем .modal-body соответствующим методом
        if (typeof $.ui !== 'undefined' && $(modalEl).data('ui-dialog')) {
            // jQuery UI: используем jQuery для надёжного поиска и обновления
            var body = $(modalEl).find('.modal-body');
            if (body.length) {
                body.html(newHtml);
                return true;
            }
            // Фоллбэк: контент диалога
            var content = $(modalEl).find('.ui-dialog-content');
            if (content.length) {
                content.html(newHtml);
                return true;
            }
        } else {
            // Кастомный режим: нативный DOM
            body = modalEl.querySelector('.modal-body');
            if (body) {
                body.innerHTML = newHtml;
                return true;
            }
        }
        
        // Общий фоллбэк: обновляем сам модал (на крайний случай)
        if (modalEl.innerHTML !== undefined) {
            // Но стараемся не ломать структуру — ищем первый подходящий контейнер
            var fallback = modalEl.querySelector('[class*="body"], [class*="content"]') || modalEl;
            if (typeof $.ui !== 'undefined' && $(modalEl).data('ui-dialog')) {
                $(fallback).html(newHtml);
            } else {
                fallback.innerHTML = newHtml;
            }
            return true;
        }
        return false;
    };

    var handleResponse = function(raw) {
        var data = (raw || '').trim();
        var isOk = (data.toLowerCase() === 'ok') || 
                   (data.indexOf('<form') === -1 && data.toLowerCase().indexOf('error') === -1);

        if (isOk) {
            // Показ результата в модале (ИСПРАВЛЕНО для jQuery UI)
            if (cfg.showResult && data && data.indexOf('<form') === -1) {
                var resultHtml = 
                    '<div style="padding:20px;text-align:center;">' +
                        '<div style="font-weight:600;font-size:1.1em;">' + (cfg.successMsg || 'Операция выполнена') + '</div>' +
                        '<div style="margin-top:12px;color:#555;line-height:1.5;">' + data + '</div>' +
                    '</div>';
                
                // Используем универсальный метод обновления
                _updateModalBody(modal, resultHtml);
                
            } else {
                // Стандартное уведомление
                if (typeof UM_Alert === 'function') UM_Alert('success', successMsg);
            }
            
            if (typeof onSuccess === 'function') onSuccess(data);

            // Меняем кнопки на одну "Закрыть"
            _setModalButtons(modal, [{
                text: lang.close || 'Закрыть',
                class: 'primary',
                click: function() { if (closeFn) closeFn(); }
            }]);

            // Автозакрытие
            if (cfg.autoClose !== false) {
                setTimeout(function() { if (closeFn) closeFn(); }, 1500);
            }
        } else {
            // Ошибка валидации: обновляем контент (тоже через _updateModalBody)
            if (_updateModalBody(modal, data)) {
                // Перепривязываем отправку для новой формы
                var newForm = modal.querySelector('form') || (typeof $ !== 'undefined' ? $(modal).find('form').get(0) : null);
                if (newForm) {
                    newForm.onsubmit = function(e) {
                        e.preventDefault();
                        UM_SaveForm(cfg);
                    };
                }
            }

            if (typeof UM_Alert === 'function') {
                var err = data;
                if (data.indexOf('<') !== -1) {
                    var tmp = document.createElement('div'); tmp.innerHTML = data;
                    err = tmp.textContent || tmp.innerText || 'Исправьте ошибки в форме';
                }
                UM_Alert('warning', err);
            }
        }
    };

    // Автоопределение метода отправки
    var isJq = typeof $ !== 'undefined' && typeof $.ajax !== 'undefined' && 
               window.UM_CONFIG && window.UM_CONFIG.jquery_ui === 'true';

    if (isJq) {
        $.ajax({
            url: url,
            method: 'POST',
            data: fd,
            processData: false,
            contentType: false,
            success: handleResponse,
            error: function() {
                if (typeof UM_Alert === 'function') UM_Alert('error', 'Ошибка сети при сохранении');
            }
        });
    } else {
        fetch(url, { method: 'POST', body: fd })
            .then(function(r) { return r.text(); })
            .then(handleResponse)
            .catch(function() {
                if (typeof UM_Alert === 'function') UM_Alert('error', 'Ошибка сети при сохранении');
            });
    }
}


/**
 * UM_InlineAction — быстрое инлайн-обновление без модалов
 * Для рейтингов, счётчиков, переключателей. Возвращает результат в один колбэк.
 * @param {Object} cfg {url, data, callback, target, ...}
 */
function UM_InlineAction(cfg) {
    var url = cfg.url;
    var data = cfg.data || {};
    var callback = cfg.callback || null;
    var target = cfg.target || null;
    var dataType = cfg.dataType || 'json';
    var method = cfg.method || 'POST';
    
    if (!url) return;
    
    // Обработчик ответа
    var handleResponse = function(response) {

        // Парсинг JSON если нужно
        var result = response;
        if (dataType === 'json' && typeof response === 'string') {
            try { result = JSON.parse(response); } 
            catch(e) { result = { error: 'Invalid JSON: ' + response }; }
        }
        
        // Вызываем ОДИН колбэк с результатом — дальше пользователь сам решает
        if (typeof callback === 'function') {
            callback(result);
        }
        
        // Опционально: авто-обновление элемента, если указан target И нет колбэка
        if (!callback && target && result.rating !== undefined) {
            var el = document.querySelector(target);
            if (el) {
                el.innerHTML = result.rating;
                if (result.rating > 0) el.className = 'orderdesc-rating-plus';
            }
        }
    };
    
    // Отправка (авто: jQuery / Fetch)
    var isJq = typeof $ !== 'undefined' && typeof $.ajax !== 'undefined';
    
    if (isJq) {
        $.ajax({
            url: url,
            method: method,
             data,
            dataType: dataType,
            success: handleResponse,
            error: function(xhr) { handleResponse({ error: 'Network error: ' + xhr.status }); }
        });
    } else {
        fetch(url, {
            method: method,
            body: method === 'POST' ? (function() {
                var fd = new FormData();
                for(var k in data) if(data.hasOwnProperty(k)) fd.append(k, data[k]);
                return fd;
            })() : null
        })
        .then(function(r) { return dataType === 'json' ? r.json() : r.text(); })
        .then(handleResponse)
        .catch(function(err) { handleResponse({ error: 'Network error' }); });
    }
}

/**
 * UM_ConfirmAction — простое подтверждение действия
 * Показывает диалог "Да/Нет", выполняет колбэк при подтверждении.
 * @param {string} message Текст сообщения
 * @param {Function} onConfirm Колбэк при подтверждении
 * @param {Function} [onCancel] Колбэк при отмене
 */
function UM_ConfirmAction(message, onConfirm, onCancel) {
    // Если подключен jQuery UI и включены ajax-окна
    if (typeof $.ui !== 'undefined' && typeof $.fn.dialog !== 'undefined') {
        const dialog = $('<div title="Подтверждение">' + message + '</div>').dialog({
            modal: true,
            width: 400,
            resizable: false,
            buttons: [
                {
                    text: 'Отмена',
                    click: function() {
                        $(this).dialog('close');
                        if (typeof onCancel === 'function') onCancel();
                    }
                },
                {
                    text: 'Удалить',
                    class: 'ui-priority-secondary',
                    click: function() {
                        $(this).dialog('close');
                        if (typeof onConfirm === 'function') onConfirm();
                    }
                }
            ],
            close: function() { $(this).remove(); }
        });
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'um_modal um_warning';
    modal.innerHTML = `
        <div style="font-weight:600;margin-bottom:12px;">Подтверждение</div>
        <div style="margin-bottom:16px;">` + message + `</div>
        <div style="text-align:right;">
            <button id="confirmCancel" style="margin-right:8px;padding:6px 16px;border:none;border-radius:4px;cursor:pointer;">Отмена</button>
            <button id="confirmOk" style="padding:6px 16px;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;">Удалить</button>
        </div>
    `;
    Object.assign(modal.style, {
        position: 'fixed',
		display: 'block',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '90%',
        background: '#fff',
        color: '#333'
    });
    
    document.body.appendChild(modal);
    
    // Затемнение фона
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;';
    document.body.insertBefore(backdrop, document.body.firstChild);
    
    const handleCancel = () => { cleanup(); if (typeof onCancel === 'function') onCancel(); };
    const handleConfirm = () => { cleanup(); if (typeof onConfirm === 'function') onConfirm(); };
    
    document.getElementById('confirmOk').onclick = handleConfirm;
    document.getElementById('confirmCancel').onclick = handleCancel;
    
    const cleanup = () => {
        modal.remove();
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
    };
    
    const onKey = (e) => { if (e.key === 'Escape') handleCancel(); };
    document.addEventListener('keydown', onKey);
    
    // Закрытие по клику на фон
    backdrop.onclick = handleCancel;
}

/**
 * UM_Alert — системное всплывающее уведомление
 * @param {string} type Тип: 'error' | 'success' | 'warning' | 'info'
 * @param {string} message Текст сообщения (поддерживает HTML)
 * @param {Object} [options] Дополнительные настройки
 * @param {number} [options.duration=3000] Время показа в мс
 * @param {boolean} [options.clickToClose=true] Закрытие по клику
 * @param {string} [options.position='top-right'] Позиция: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 * @returns {HTMLElement} Созданный элемент уведомления
 */
function UM_Alert(type, message, options) {
    var opts = options || {};
    var duration = opts.duration !== undefined ? opts.duration : 3000;
    var clickToClose = opts.clickToClose !== false;
    var position = opts.position || 'top-right';
    
    var classMap = {
        'error': 'um_error',
        'success': 'um_success', 
        'warning': 'um_warning',
        'info': 'um_info'
    };
    
    var msgClass = classMap[type] || 'um_info';
    
    var notify = document.createElement('div');
    notify.className = msgClass + ' um-alert-popup';
    notify.innerHTML = message;
    
    // Позиционирование
    var posClass = 'um-alert-' + position.replace('-', '-');
    notify.classList.add(posClass);
    
    Object.assign(notify.style, {
        position: 'fixed',
        margin: '0',
        zIndex: 9999,
        cursor: clickToClose ? 'pointer' : 'default',
        animation: 'um-slideInRight 0.3s ease',
        maxWidth: '400px',
        minWidth: '280px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    
    document.body.appendChild(notify);
    
    // Функция закрытия
    var close = function() {
        notify.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        notify.style.opacity = '0';
        notify.style.transform = 'translateY(-10px)';
        setTimeout(function() { if (notify.parentNode) notify.parentNode.removeChild(notify); }, 300);
    };
    
    // Закрытие по клику
    if (clickToClose) {
        notify.addEventListener('click', close);
    }
    
    // Авто-скрытие
    if (duration > 0) {
        setTimeout(close, duration);
    }
    
    return notify;
}